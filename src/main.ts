import express from "express";
import router from "./router";
import logger from "./logger";
import { config } from "./config";

const app = express();
app.use(express.json());
app.use(router);

app.listen({ port: config.PORT, host: config.ENDPOINT }, () => {
    logger.info(`AI Code Reviewer listening on port ${config.PORT}`);
});
