import { z } from "zod";

export const schema = z.object({
    files: z.array(
        z.object({
            path: z.string(),
            comments: z.array(z.object({ line: z.number(), body: z.string() })),
            score: z.number(),
        }),
    ),
    overallScore: z.number(),
});

export type ReviewSchema = z.infer<typeof schema>;
