import { readFileSync } from "fs";
import { generateText, Output } from "ai";
import axios from "axios";
import { reviewSchema } from "./schema";
import { model } from "./model";
import logger from "../../logger";
import type { Request, Response } from "express";

const giteaUrl = process.env.GITEA_URL;
const giteaAuth = { headers: { Authorization: `token ${process.env.GITEA_TOKEN}` } };
const systemPrompt = readFileSync(new URL("./system-prompt.md", import.meta.url), "utf-8");

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
        const baseUrl: string = `${giteaUrl}/repos/${base.repo.full_name}`;
        const { data: diffContent } = await axios.get(`${baseUrl}/pulls/${number}.diff`, giteaAuth);

        const { output } = await generateText({
            model,
            system: systemPrompt,
            prompt: diffContent,
            output: Output.object({ schema: reviewSchema }),
        });

        const threshold = Number(process.env.REQUEST_CHANGES_THRESHOLD ?? "8");
        const requestChanges = output.overallScore < threshold;
        const reviewEndpoint = `${baseUrl}/pulls/${number}/reviews`;
        const comments = output.files.flatMap((file) => {
            return file.comments.map((c) => ({
                path: file.path,
                new_position: c.line,
                body: c.body,
            }));
        });

        try {
            await axios.post(
            reviewEndpoint,
            {
                body: `### 🤖 AI Review\n\n**Overall Score:** ${output.overallScore}/10`,
                event: requestChanges ? "REQUEST_CHANGES" : "COMMENT",
                comments,
            },
            giteaAuth,
        );
        } catch (err) {
            logger.error(`Failed to post review: ${err}`);
        }
    }
}
