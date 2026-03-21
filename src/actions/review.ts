import { readFileSync } from "fs";
import { generateText, Output } from "ai";
import { reviewSchema } from "./schema";
import { model } from "../provider/google";
import logger from "../logger";
import type { Request, Response } from "express";
import Gitea from "../clients/gitea";

const giteaUrl = process.env.GITEA_URL;
const systemPrompt = readFileSync("src/actions/system-prompt.md", "utf-8");

/**
 * Handles the review process for a pull request.
 * @param req The request object.
 * @param res The response object.
 */

export async function review(req: Request, res: Response) {
    const { action, pull_request, requested_reviewer } = req.body as any;

    res.status(200).send("Event received. Processing review...");
    logger.info("Received review webhook");
    if (action === "review_requested" && requested_reviewer.username === process.env.BOT_NAME) {
        const { base, number } = pull_request;
        const gitea = new Gitea(`${giteaUrl}/repos/${base.repo.full_name}`, process.env.GITEA_TOKEN!);
        const { data: diffContent } = await gitea.getDiff(number);

        const { output } = await generateText({
            model,
            system: systemPrompt,
            prompt: diffContent,
            output: Output.object({ schema: reviewSchema }),
        });

        const threshold = Number(process.env.REQUEST_CHANGES_THRESHOLD);
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
