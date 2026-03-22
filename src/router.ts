import express, { Router, Request, Response, NextFunction } from "express";
import { review } from "./review";
import Gitea from "./gitea";
import { config } from "./config";
import logger from "./logger";

const router: Router = express.Router();

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

const rateLimitState = new Map<string, RateLimitEntry>();

/**
 * Middleware to rate limit incoming review requests based on client IP address.
 * Limits the number of requests allowed within a specified time window.
 * @returns Middleware function to be used in the Express router.
 * @throws 429 Too Many Requests if the client exceeds the allowed request rate.
 */
function rateLimitReviewRequests(req: Request, res: Response) {
    const clientKey = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = rateLimitState.get(clientKey);

    if (!entry || entry.resetAt <= now) {
        rateLimitState.set(clientKey, {
            count: 1,
            resetAt: now + config.RATE_LIMIT_WINDOW_MS,
        });

        return true;
    }

    if (entry.count >= config.RATE_LIMIT_MAX_REQUESTS) {
        const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
        logger.warn(`Rate limit exceeded ip=${clientKey} retry_after_seconds=${retryAfterSeconds}`);
        res.status(429).setHeader("Retry-After", String(retryAfterSeconds)).send("Too Many Requests");
        return false;
    }

    entry.count += 1;
    return true;
}

/**
 * Middleware to guard the review endpoint by validating the webhook secret and applying rate limiting.
 */
function reviewRequestGuard(req: Request, res: Response, next: NextFunction) {
    if (!rateLimitReviewRequests(req, res)) return;
    

    const gitea = new Gitea(config.GITEA_URL, config.GITEA_TOKEN);
    if (!gitea.validateSecret(req, config.GITEA_WEBHOOK_SECRET)) {
        logger.warn("Invalid webhook signature");
        return res.status(401).send("Unauthorized: Invalid webhook signature");
    }

    return next();
}

router.get("/health", async (req: Request, res: Response) => {
    try {
        const gitea = new Gitea(config.GITEA_URL, config.GITEA_TOKEN);
        await gitea.healthCheck();

        return res.status(200).json({
            status: "ok",
            checks: {
                gitea: "ok",
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(503).json({
            status: "degraded",
            checks: {
                gitea: "failed",
            },
            timestamp: new Date().toISOString(),
        });
    }
});

router.post("/review", reviewRequestGuard, review);

export default router;
