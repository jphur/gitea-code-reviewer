import express from "express";
import router from "./router";
import logger from "./logger";

const app = express();
app.use(express.json());
app.use(router);

app.listen({ port: process.env.PORT, host: process.env.ENDPOINT }, () => {
    logger.info(`AI Code Reviewer listening on port ${process.env.PORT}`);
});
