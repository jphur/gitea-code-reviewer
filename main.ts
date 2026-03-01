import express from "express";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import axios from "axios";

const app = express();
app.use(express.json());

app.post("/webhook", async (req: any, res: any) => {
    const event = req.body;
    console.log("Evento recibido:", event);
    // 1. Detectamos si es una Pull Request y si se ha asignado a nuestro bot
    if (event.action === "assigned" && event.pull_request.assignee.login === "AI") {
        const diffUrl = `${event.pull_request.html_url}.diff`;
        const commentsUrl = event.pull_request.comments_url;

        // 2. Descargamos el diff
        const { data: diffContent } = await axios.get(diffUrl);

        // 3. Le preguntamos a Gemini
        const { text } = await generateText({
            model: google("gemini-3-flash-preview"),
            system: "Eres un revisor de código experto...",
            prompt: `Revisa este código: ${diffContent}`,
        });

        // 4. Respondemos en Gitea usando el Token que generaste
        await axios.post(
            commentsUrl,
            { body: `### 🤖 Revisión de IA\n\n${text}` },
            { headers: { Authorization: `token ${process.env.GITEA_TOKEN}` } },
        );
    }
    res.status(200).send("Evento procesado");
});

app.listen(4000, () => console.log("Bot de IA escuchando en el puerto 4000"));
