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
    GITEA_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(60000),
    MAX_DIFF_CHARS: z.coerce.number().int().positive().default(200000),
    REQUEST_RETRY_COUNT: z.coerce.number().int().min(0).default(2),
    REQUEST_RETRY_DELAY_MS: z.coerce.number().int().positive().default(500),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(60),
});

export const config = configSchema.parse(process.env);
