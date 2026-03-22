import { z } from "zod";

const configSchema = z.object({
    GITEA_URL: z.string(),
    GITEA_TOKEN: z.string().min(1),
    GITEA_WEBHOOK_SECRET: z.string().min(1),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    BOT_NAME: z.string().min(1).default("AI"),
    PORT: z.coerce.number().int().positive().default(4000),
    ENDPOINT: z.string().min(1).default("0.0.0.0"),
    REQUEST_CHANGES_THRESHOLD: z.coerce.number().default(8),
});

export const config = configSchema.parse(process.env);
