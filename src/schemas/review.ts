import { z } from "zod";

export const reviewSchema = z.object({
    files: z
        .array(
            z.object({
                path: z.string(),
                comments: z.array(z.object({ line: z.number(), body: z.string() })).default([]),
                score: z.number().optional(),
            }),
        )
        .default([]),
    overallScore: z.number(),
    summary: z.string(),
});

export type ReviewSchema = z.infer<typeof reviewSchema>;
