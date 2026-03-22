import { readFileSync } from "fs";
import { generateText, Output } from "ai";
import { reviewSchema } from "./schemas/review";
import { model } from "./provider/google";
import logger from "./logger";
import type { Request, Response } from "express";
import Gitea from "./gitea";
import { config } from "./config";
import { webhookSchema } from "./schemas/webhook";

const systemPrompt = readFileSync("src/system-prompt.md", "utf-8");

/**
 * Handles the review process for a pull request.
 * @param req The request object.
 * @param res The response object.
 */
export async function review(req: Request, res: Response) {
    const parsedWebhook = webhookSchema.safeParse(req.body);
    if (!parsedWebhook.success) {
        const message = `Invalid webhook payload: ${parsedWebhook.error.message}`;
        logger.warn(message);
        return res.status(400).send(message);
    }

    const { action, pull_request, requested_reviewer } = parsedWebhook.data;
    if (action === "review_requested" && (!pull_request || !requested_reviewer)) {
        const message = "Invalid review_requested payload: missing pull_request or requested_reviewer";
        logger.warn(message);
        return res.status(400).send(message);
    }

    logger.info("Received review webhook");
    if (action === "review_requested" && requested_reviewer?.username === config.BOT_NAME && pull_request) {
        const { base, number } = pull_request;
        const gitea = new Gitea(`${config.GITEA_URL}/repos/${base.repo.full_name}`, config.GITEA_TOKEN);

        if (!gitea.validateSecret(req, config.GITEA_WEBHOOK_SECRET)) {
            const message = "Invalid webhook signature";
            logger.warn(message);
            return res.status(401).send(message);
        }

        res.status(200).send("Event received. Processing review...");
        const { data: diffContent } = await gitea.getDiff(number);
        const { output } = await generateText({
            model,
            system: systemPrompt,
            prompt: diffContent,
            output: Output.object({ schema: reviewSchema }),
        });

        const threshold = config.REQUEST_CHANGES_THRESHOLD;
        const requestChanges = output.overallScore < threshold;
        const comments = output.files.flatMap((file) => {
            return file.comments.map((c) => ({
                path: file.path,
                new_position: c.line,
                body: c.body,
            }));
        });

        try {
            await gitea.postReview(number, output.summary, requestChanges ? "REQUEST_CHANGES" : "APPROVE", comments);
            logger.info(`Posted review for PR #${number} with overall score ${output.overallScore}`);
        } catch (err) {
            logger.error(`Failed to post review: ${err}`);
        }
    }
}
