import express from "express";
import router from "./router.ts";

const app = express();
app.use(express.json());
app.use(router);

app.listen({ port: process.env.PORT, host: process.env.ENDPOINT }, () => {
    console.log(`AI Code Reviewer listening on port ${process.env.PORT}`);
});
