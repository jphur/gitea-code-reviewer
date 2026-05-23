import { readFileSync } from "fs";
import { generateText, Output } from "ai";
import { reviewSchema } from "../schemas/review";
import { model } from "../provideer";
import logger from "./logger";
import type { Request, Response } from "express";
import Gitea from "./gitea";
import { config } from "../config";

/**
 * Generates a review using the AI model and posts the review back to Gitea.
 */
export async function review(req: Request, res: Response) {
    const payload = req.body;

    logger.info('Pull Request received.')
    const { base, number } = payload.pull_request;
    const gitea = new Gitea(`${config.GITEA_URL}/repos/${base.repo.full_name}`, config.GITEA_TOKEN);
    res.status(200).send("Event received. Processing review...");

    try {
        logger.info('Reading diff...');
        const diffContent = await gitea.getDiff(number);
        const systemPrompt = readFileSync("src/resources/system-prompt.md", "utf-8");

        logger.info('Asking AI model for a review...');
        const { output } = await generateText({
            model,
            system: systemPrompt,
            prompt: diffContent,
            output: Output.object({ schema: reviewSchema }),
            abortSignal: AbortSignal.timeout(config.AI_TIMEOUT_MS),
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

        logger.info('Posting review...');
        await gitea.postReview(number, output.summary, requestChanges ? "REQUEST_CHANGES" : "APPROVE", comments);
        logger.info('Review posted successfully.')
    } catch (err) {
        logger.error(`Failed to review pull request: ${err}`);
    }
}

