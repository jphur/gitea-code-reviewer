import { google } from "@ai-sdk/google";
import { config } from "./config";

export const model: ReturnType<typeof google> = google(config.AI_MODEL);
