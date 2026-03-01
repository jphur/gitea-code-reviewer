import { generateText, tool, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { chromium } from "playwright";

const playwright = tool({
    description: "Use Playwright to interact with web pages.",
    inputSchema: z.object({
        url: z.string(),
    }),
    execute: async ({ url }) => {
        try {
            const browser = await chromium.launch({ headless: false });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: "networkidle" });
            const content = await page.content();
            await browser.close();
            return content;
        } catch (error: any) {
            console.error("❌ Playwright:", error.message);
            return {
                ok: false,
                error: error.message,
                stack: error.stack,
            };
        }
    },
});

async function main() {
    const res = await generateText({
        model: google("gemini-2.5-flash-lite"),
        stopWhen: stepCountIs(2),
        // providerOptions: {
        //     google: {
        //         thinkingConfig: { thinkingLevel: "minimal" },
        //     },
        // },
        tools: { playwright },
        prompt: 'Go to "https://verdnatura.es" and tell me what you see on the website in 150 words or less.',
    });

    console.log("\n🤖 OPINIÓN DEL MODELO:\n");
    console.log(res.text);
}

main();
