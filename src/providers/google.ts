import { google } from "@ai-sdk/google";

export const model: ReturnType<typeof google> = google("gemini-3.1-flash-lite");
