import express from "express";
import { generateText, Output } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import axios from "axios";

const app = express();
app.use(express.json());
const giteaUrl = process.env.GITEA_URL;
const giteaAuth = { headers: { Authorization: `token ${process.env.GITEA_TOKEN}` } };

app.post("/review", async (req: any, res: any) => {
    res.status(200).send("Evento recibido. Procesando revisión...");
    const { action, pull_request, requested_reviewer } = req.body;
    if (action === "review_requested" && requested_reviewer.username === "AI") {
        const { base, number } = pull_request;
        const baseUrl = `${giteaUrl}/repos/${base.repo.full_name}`;
        const { data: diffContent } = await axios.get(`${baseUrl}/pulls/${number}.diff`, giteaAuth);

        const { output } = await generateText({
            model: google("gemini-2.5-flash-lite"),
            system: "You are an expert code reviewer. Provide corrections for every file. You must answer in Spanish.",
            prompt: `Review the following code changes and provide feedback for each modified file:\n\n${diffContent}`,
            output: Output.object({
                schema: z.object({
                    files: z.array(
                        z.object({
                            path: z.string(),
                            comments: z.array(z.object({ line: z.number(), body: z.string() })),
                            score: z.number(),
                        }),
                    ),
                    overallScore: z.number(),
                }),
            }),
            // providerOptions: { google: { thinkingLevel: "minimal" } },
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
                body: `### 🤖 Revisión de IA\n\n**Puntuación general:** ${output.overallScore}/10`,
                event: isBad ? "REQUEST_CHANGES" : "COMMENT",
                comments,
            },
            giteaAuth,
        );
    }
});

app.listen(4000, () => console.log("Bot de IA escuchando en el puerto 4000"));
