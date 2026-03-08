import { google } from "@ai-sdk/google";

// central place to pick which model we use for reviews
// annotate explicitly to avoid TS inferring an unportable type
export const model: ReturnType<typeof google> = google("gemini-3.1-flash-lite-preview");
