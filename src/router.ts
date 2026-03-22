import express, { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { review } from "./review";
import Gitea from "./gitea";
import { config } from "./config";
import logger from "./logger";

const router: Router = express.Router();

router.get("/health", async (req: Request, res: Response) => {
    try {
        const gitea = new Gitea(config.GITEA_URL, config.GITEA_TOKEN);
        await gitea.healthCheck();
        logger.info("Health check successful");
    } catch (error) {
        logger.error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
});

router.post(
    "/review",
    (req: Request, res: Response, next: NextFunction) => {
        const gitea = new Gitea(config.GITEA_URL, config.GITEA_TOKEN);
        if (!gitea.validateSecret(req, config.GITEA_WEBHOOK_SECRET)) {
            logger.warn("Invalid webhook signature");
            return res.status(401).send("Unauthorized: Invalid webhook signature");
        }
        next();
    },
    review,
);

export default router;
