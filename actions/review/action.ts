import { readFileSync } from "fs";
import { generateText, Output } from "ai";
import axios from "axios";
import { schema } from "./schema.ts";
import { model } from "./model.ts";

const giteaUrl = process.env.GITEA_URL;
const giteaAuth = { headers: { Authorization: `token ${process.env.GITEA_TOKEN}` } };
const systemPrompt = readFileSync(new URL("./system-prompt.md", import.meta.url), "utf-8");

/**
 * Handles the review process for a pull request.
 * @param req The request object.
 * @param res The response object.
 */
export async function review(req, res) {
    res.status(200).send("Event received. Processing review...");
    const { action, pull_request, requested_reviewer } = req.body;
    if (action === "review_requested" && requested_reviewer.username === "AI") {
        const { base, number } = pull_request;
        const baseUrl: string = `${giteaUrl}/repos/${base.repo.full_name}`;
        const { data: diffContent } = await axios.get(`${baseUrl}/pulls/${number}.diff`, giteaAuth);

        const { output } = await generateText({
            model,
            system: systemPrompt,
            prompt: diffContent,
            output: Output.object({ schema }),
        });

        const isBad = output.overallScore < 8;
        const reviewEndpoint = `${baseUrl}/pulls/${number}/reviews`;

        const comments = output.files.flatMap((fileFeedback) => {
            const seen = new Set<string>();

            const mapped = fileFeedback.comments.flatMap((c) => {
                const new_position = c.line;

                const body = c.body;
                const key = `${fileFeedback.path}|${new_position}|${body}`;
                if (seen.has(key)) return [];
                seen.add(key);

                return [{ path: fileFeedback.path, new_position, body }];
            });

            return mapped.slice(0, 8);
        });

        await axios.post(
            reviewEndpoint,
            {
                body: `### 🤖 AI Review\n\n**Overall Score:** ${output.overallScore}/10`,
                event: isBad ? "REQUEST_CHANGES" : "COMMENT",
                comments,
            },
            giteaAuth,
        );
    }
}
