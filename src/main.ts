import express from "express";
import router from "./router";
import logger from "./logger";
import { config } from "./config";
import Gitea from "./gitea";

const app = express();
app.use(
    express.json({
        verify: (req, _res, buf) => {
            const request = req as express.Request & { rawBody?: Buffer };
            request.rawBody = Buffer.from(buf);
        },
    }),
);
app.use(router);

app.listen({ port: config.PORT, host: config.ENDPOINT }, async () => {
    const gitea = new Gitea(config.GITEA_URL, config.GITEA_TOKEN);
    logger.info("Starting AI Code Reviewer...");
    await gitea.healthCheck();
    logger.info("Successfully connected to Gitea API");
    logger.info(`AI Code Reviewer listening on port ${config.PORT}`);
});
