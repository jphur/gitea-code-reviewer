import express, { Router, Request, Response, NextFunction } from "express";
import { review } from "./review";
import Gitea from "./gitea";
import { config } from "./config";
import logger from "./logger";

const router: Router = express.Router();

/**
 * Middleware to guard the review endpoint by validating the webhook secret.
 */
function reviewRequestGuard(req: Request, res: Response, next: NextFunction) {
    const gitea = new Gitea(config.GITEA_URL, config.GITEA_TOKEN);
    if (!gitea.validateSecret(req, config.GITEA_WEBHOOK_SECRET)) {
        logger.warn("Invalid webhook signature");
        return res.status(401).send("Unauthorized: Invalid webhook signature");
    }

    return next();
}

router.post("/review", reviewRequestGuard, review);

export default router;
