import { Request, Response, NextFunction } from "express";
import Gitea from "../core/gitea";
import { config } from "../config";
import logger from "../core/logger";
import { webhookSchema } from "../schemas/webhook";

/**
 * Validate review endpoint by validating the webhook secret and payload.
 */
export function validateReviewRequest(req: Request, res: Response, next: NextFunction) {
    const gitea = new Gitea(config.GITEA_URL, config.GITEA_TOKEN);
    if (!gitea.validateSecret(req, config.GITEA_WEBHOOK_SECRET)) {
        logger.warn("Invalid webhook signature");
        return res.status(401).send("Unauthorized: Invalid webhook signature");
    }

    const parsedWebhook = webhookSchema.safeParse(req.body);
    let message: string = "Webhook payload is valid";
    const { action, pull_request, requested_reviewer } = parsedWebhook.data ?? {};
    try {
        if (!parsedWebhook.success || !pull_request || !requested_reviewer || action != "review_requested") {
            message = "Invalid webhook payload";
            return res.status(400).send(message);
        }

        if (requested_reviewer?.username != config.BOT_NAME) {
            message = "Review requested by a user other than the bot.";
            return res.status(200).send(message);
        }
    } finally {
        logger.info(message);
    }

    return next();
}