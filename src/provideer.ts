import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { config } from "./config";

const google = createGoogleGenerativeAI({
  apiKey: config.AI_API_KEY,
});

export const model: ReturnType<typeof google> = google(config.AI_MODEL);
