import axios from "axios";
import { config } from "../config";
import crypto from "crypto";
import type { Request } from "express";

class Gitea {
    private client;
    constructor(
        private baseUrl: string,
        private token: string,
    ) {
        this.client = this.getClient();
    }

    private getClient() {
        return axios.create({
            baseURL: this.baseUrl,
            headers: { Authorization: `token ${this.token}` },
            timeout: config.GITEA_TIMEOUT_MS,
        });
    }

    /**
     * A helper method to perform API calls with retry logic.
     */
    private async call<T>(cb: () => Promise<T>, description: string) {
        const retries = config.REQUEST_RETRY_COUNT;
        const delayMs = config.REQUEST_RETRY_DELAY_MS;
        let lastError;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await cb();
            } catch (error) {
                lastError = error;
                if (attempt === retries) break;
                await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
            }
        }

        const err = axios.isAxiosError(lastError) ? JSON.stringify(lastError.response?.data) : lastError;
        throw new Error(description + " after " + (retries + 1) + " attempts: " + err);
    }

    async getDiff(pullRequestNumber: number) {
        return this.call(async () => {
            const res = await this.client.get(`/pulls/${pullRequestNumber}.diff`);
            return res.data;
        }, `Failed to fetch diff for PR #${pullRequestNumber}`);
    }

    async postReview(pullRequestNumber: number, body: string, event: string, comments: any[]) {
        await this.call(async () => {
            await this.client.post(`/pulls/${pullRequestNumber}/reviews`, {
                body,
                event,
                comments,
            });
        }, `Failed to post review for PR #${pullRequestNumber}`);
    }

    async healthCheck() {
        await this.call(async () => {
            await this.client.get("/user");
        }, "Failed to verify Gitea connectivity");
    }

    /**
     * Validates the incoming webhook request by comparing the provided signature with the expected signature.
     * @returns Boolean
     */
    validateSecret(req: Request, secret: string) {
        const signature = req.header("X-Gitea-Signature");
        const request = req as Request & { rawBody?: Buffer };

        if (!signature || !request.rawBody) return false;

        const expectedSignature = crypto.createHmac("sha256", secret).update(request.rawBody).digest("hex");
        const expected = Buffer.from(expectedSignature, "hex");
        const provided = Buffer.from(signature, "hex");

        if (expected.length !== provided.length) return false;

        return crypto.timingSafeEqual(expected, provided);
    }
}

export default Gitea;
