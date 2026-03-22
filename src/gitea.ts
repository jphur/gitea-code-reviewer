import axios from "axios";
import { config } from "./config";
import crypto from "crypto";
import type { Request } from "express";

function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") return `timed out after ${config.GITEA_TIMEOUT_MS}ms`;
        if (error.response) return `HTTP ${error.response.status}${error.response.statusText ? ` ${error.response.statusText}` : ""}`;
    }

    return error instanceof Error ? error.message : String(error);
}

class Gitea {
    private client;
    constructor(
        private baseUrl: string,
        private token: string,
    ) {
        this.client = this.getClient();
    }

    /**
     * Creates and returns an Axios client instance with the base URL and authorization headers.
     * @returns Axios instance
     */
    private getClient() {
        return axios.create({
            baseURL: this.baseUrl,
            headers: { Authorization: `token ${this.token}` },
            timeout: config.GITEA_TIMEOUT_MS,
        });
    }

    /**
     * A helper method to perform API calls with retry logic.
     * @param cb The callback function that performs the API call and returns a promise.
     * @param description A description of the API call being made, used for error messages.
     * @returns The result of the API call if successful.
     * @throws An error if all retry attempts fail, including the last error message.
     */
    private async call<T>(cb: () => Promise<T>, description: string) {
        const retries = config.REQUEST_RETRY_COUNT;
        const delayMs = config.REQUEST_RETRY_DELAY_MS;
        let lastError: unknown;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await cb();
            } catch (error) {
                lastError = error;
                if (attempt === retries) break;
                await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
            }
        }

        throw new Error(`${description} after ${retries + 1} attempts: ${getErrorMessage(lastError)}`);
    }

    /**
     * Fetches the diff content for a specific pull request.
     * @param pullRequestNumber The number of the pull request to fetch the diff for.
     * @returns The response from the Gitea API containing the diff content.
     */
    async getDiff(pullRequestNumber: number) {
        return this.call(async () => {
            const res = await this.client.get(`/pulls/${pullRequestNumber}.diff`);
            return res.data;
        }, `Failed to fetch diff for PR #${pullRequestNumber}`);
    }

    /**
     * Posts a review for a specific pull request with the given body, event type, and comments.
     * @param pullRequestNumber The number of the pull request to post the review for.
     * @param body The body of the review comment.
     * @param event The type of review event (e.g., "APPROVE", "REQUEST_CHANGES").
     * @param comments An array of comments to include in the review, each containing the file path, line number, and comment body.
     */
    async postReview(pullRequestNumber: number, body: string, event: string, comments: any[]) {
        await this.call(async () => {
            await this.client.post(`/pulls/${pullRequestNumber}/reviews`, {
                body,
                event,
                comments,
            });
        }, `Failed to post review for PR #${pullRequestNumber}`);
    }

    /**
     * Checks that the configured token can reach the Gitea API.
     */
    async healthCheck() {
        await this.call(async () => {
            await this.client.get("/api/v1/user");
        }, "Failed to verify Gitea connectivity");
    }

    /**
     * Validates the incoming webhook request by comparing the provided signature with the expected signature generated using the secret and the raw request body.
     * @param req The incoming request object containing the webhook payload and headers.
     * @param secret The secret key used to generate the expected signature for validation.
     * @returns A boolean indicating whether the webhook signature is valid (true) or not (false).
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
