import { readFileSync } from "fs";
import { generateText, Output } from "ai";
import { reviewSchema } from "./schemas/review";
import { model } from "./provider/google";
import logger from "./logger";
import type { Request, Response } from "express";
import Gitea from "./gitea";
import { config } from "./config";
import { webhookSchema } from "./schemas/webhook";

/**
 * Builds a log context string for a specific repository and pull request.
 * @param repoFullName The full name of the repository.
 * @param pullRequestNumber The number of the pull request.
 * @returns A formatted log context string.
 */
function buildLogContext(repoFullName?: string, pullRequestNumber?: number) {
    const repo = repoFullName ?? "unknown";
    const pr = pullRequestNumber ?? "unknown";

    return `{repo=${repo} pr=${pr}}`;
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Handles incoming review requests from Gitea webhooks.
 * Validates the payload,
 * generates a review using the AI model
 * and posts the review back to Gitea.
 * @param req The incoming request object containing the webhook payload.
 * @param res The response object used to send back the status of the review processing.
 */
export async function review(req: Request, res: Response) {
    const parsedWebhook = webhookSchema.safeParse(req.body);
    if (!parsedWebhook.success) {
        const message = `Invalid webhook payload: ${parsedWebhook.error.message}`;
        logger.warn(`repo=unknown pr=unknown result=invalid_payload message=${message}`);
        return res.status(400).send(message);
    }

    const { action, pull_request, requested_reviewer } = parsedWebhook.data;
    const logContext = buildLogContext(pull_request?.base.repo.full_name, pull_request?.number);
    if (action === "review_requested" && (!pull_request || !requested_reviewer)) {
        const message = "Invalid review_requested payload: missing pull_request or requested_reviewer";
        logger.warn(`${logContext} result=invalid_payload message=${message}`);
        return res.status(400).send(message);
    }

    if (action !== "review_requested" || requested_reviewer?.username !== config.BOT_NAME || !pull_request) {
        logger.info(`${logContext} result=ignored reason=not_targeted_for_bot`);
        return res.status(200).send("Event received. Ignored.");
    }

    logger.info(`${logContext} result=received`);
    if (action === "review_requested" && requested_reviewer?.username === config.BOT_NAME && pull_request) {
        const { base, number } = pull_request;
        const gitea = new Gitea(`${config.GITEA_URL}/repos/${base.repo.full_name}`, config.GITEA_TOKEN);
        res.status(200).send("Event received. Processing review...");

        try {
            logger.info(`${logContext} stage=read_diff`);
            const diffContent = await gitea.getDiff(number);
            const systemPrompt = readFileSync("src/system-prompt.md", "utf-8");

            logger.info(`${logContext} stage=generate_review`);
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

            logger.info(`${logContext} stage=post_review`);
            await gitea.postReview(number, output.summary, requestChanges ? "REQUEST_CHANGES" : "APPROVE", comments);
            logger.info(`${logContext} result=posted score=${output.overallScore}`);
        } catch (err) {
            logger.error(`${logContext} result=error message=${getErrorMessage(err)}`);
            return;
        }
    }
}
