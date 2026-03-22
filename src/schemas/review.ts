import { z } from "zod";

export const reviewSchema = z.object({
    files: z.array(
        z.object({
            path: z.string(),
            comments: z.array(z.object({ line: z.number(), body: z.string() })),
            score: z.number(),
        }),
    ),
    overallScore: z.number(),
    summary: z.string().max(50),
});

export type ReviewSchema = z.infer<typeof reviewSchema>;
