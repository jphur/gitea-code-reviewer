import { z } from "zod";

export const webhookSchema = z.object({
    action: z.string(),
    requested_reviewer: z
        .object({
            username: z.string().min(1),
        })
        .optional(),
    pull_request: z
        .object({
            number: z.number().int().positive(),
            base: z.object({
                repo: z.object({
                    full_name: z.string().min(1),
                }),
            }),
        })
        .optional(),
});

export type WebhookSchema = z.infer<typeof webhookSchema>;