import { readFileSync } from "fs";
import { generateText, Output } from "ai";
import { reviewSchema } from "../schemas/review";
import { model } from "../provideer";
import logger from "./logger";
import type { Request, Response } from "express";
import Gitea from "./gitea";
import { config } from "../config";

const systemPrompt = readFileSync("src/resources/system-prompt.md", "utf-8");

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
        const shouldReviewByFile = config.FORCE_BY_FILE || (diffContent.length > config.MAX_CHAR_DIFF);
        let comments: object[] = [];
        let score: number = 0;
        let summary: string = "";

        logger.info('Asking AI model for a review...');
        if (shouldReviewByFile) {
            const diffByFile: string[] = diffContent.split(/^diff --git a\/.* b\/.*$/gm).filter(Boolean);
            const outputs = await Promise.all(diffByFile.map(diff => getSuggestion(diff)));
            comments = outputs
                .flatMap((output) => getComments(output.files[0]));
            score = outputs
                .reduce((acc, output) => acc + output.overallScore, 0) / outputs.length;
            summary = outputs.map(o => o.summary).join("\n\n");
        } else {
            const output = await getSuggestion(diffContent);
            comments = output.files
                .flatMap((file) => getComments(file));
            score = output.overallScore;
            summary = output.summary;
        }

        const threshold = config.REQUEST_CHANGES_THRESHOLD;
        const requestChanges = score < threshold;
        logger.info('Posting review...');
        await gitea.postReview(number, summary, requestChanges ? "REQUEST_CHANGES" : "APPROVE", comments);
        logger.info('Review posted successfully.')
    } catch (err) {
        logger.error(`Failed to review pull request: ${err}`);
    }
}

async function getSuggestion(diff: string) {
    const { output } = await generateText({
        model,
        system: systemPrompt,
        prompt: diff,
        output: Output.object({ schema: reviewSchema }),
        maxOutputTokens: config.AI_MAX_OUTPUT_TOKENS,
        abortSignal: AbortSignal.timeout(config.AI_TIMEOUT_MS),
    });
    return output;
}

function getComments(file: any) {
    return file.comments.map((c: any) => ({
        path: file.path,
        new_position: c.line,
        body: c.body,
    }));
}
