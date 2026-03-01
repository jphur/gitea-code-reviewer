import { generateText, tool, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { chromium } from "playwright";
// WIP: USE MCP INSTEAD TOOLS https://ai-sdk.dev/cookbook/next/mcp-tools#mcp-tools
const playwright = tool({
    description: "Use Playwright to interact with web pages.",
    inputSchema: z.object({ url: z.string() }),
    execute: async ({ url }) => {
        try {
            const browser = await chromium.launch({ headless: false });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: "networkidle" });
            const content = await page.content();
            await browser.close();
            return content;
        } catch (err: any) {
            console.error("❌ Playwright:", err.message);
            return {
                ok: false,
                error: err.message,
                stack: err.stack,
            };
        }
    },
});

async function main() {
    const { text } = await generateText({
        model: google("gemini-3-flash-preview"),
        stopWhen: stepCountIs(2),
        providerOptions: { google: { thinkingConfig: { thinkingLevel: "minimal" } } },
        tools: { playwright },
        prompt: 'Go to "https://verdnatura.es" and tell me what you see on the website in 150 words or less.',
    });

    console.log(text);
}

main();
