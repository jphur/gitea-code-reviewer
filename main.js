import { generateText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { execFileSync } from "node:child_process";

const playwrightTool = tool({
    description: "Ejecuta Playwright contra una URL",
    inputSchema: z.object({
        url: z.string(),
    }),
    execute: async ({ url }) => {
        try {
            const output = execFileSync("npx", ["playwright", "open", url], {
                encoding: "utf8",
                stdio: "pipe", // "pipe" captura stdout/stderr en lugar de heredar
                env: { ...process.env, TARGET_URL: url },
            });
            return { output };
        } catch (error) {
            console.error("❌ Error en Playwright:", error.message);
            // Devuelve el error como parte del resultado para que el LLM lo sepa
            return {
                ok: false,
                error: error.message,
                stdout: error.stdout,
                stderr: error.stderr,
            };
        }
    },
});

async function main() {
    const result = await generateText({
        model: google("gemini-2.5-flash"),
        maxSteps: 5,
        tools: { playwrightTool },
        toolChoice: { type: "tool", toolName: "playwrightTool" },
        prompt: 'Llama a la herramienta "playwrightTool" con {"url":"https://verdnatura.es"} y resume el resultado.',
    });

    console.log("🤖 Respuesta:", result);
}

main();

const demo = {quantity: 25, iva: 21, discount: 15};
Object.entries(demo).reduce((acc, [key, value]) => {
    