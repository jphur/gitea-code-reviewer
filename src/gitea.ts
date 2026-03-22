import axios from "axios";
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

    /**
     * Creates and returns an Axios client instance with the base URL and authorization headers.
     * @returns Axios instance
     */
    private getClient() {
        return axios.create({
            baseURL: this.baseUrl,
            headers: { Authorization: `token ${this.token}` },
        });
    }

    /**
     * Fetches the diff content for a specific pull request.
     * @param pullRequestNumber The number of the pull request to fetch the diff for.
     * @returns The response from the Gitea API containing the diff content.
     */
    async getDiff(pullRequestNumber: number) {
        const res = await this.client.get(`/pulls/${pullRequestNumber}.diff`);
        return res.data;
    }

    /**
     * Posts a review for a specific pull request with the given body, event type, and comments.
     * @param pullRequestNumber The number of the pull request to post the review for.
     * @param body The body of the review comment.
     * @param event The type of review event (e.g., "APPROVE", "REQUEST_CHANGES").
     * @param comments An array of comments to include in the review, each containing the file path, line number, and comment body.
     */
    async postReview(pullRequestNumber: number, body: string, event: string, comments: any[]) {
        await this.client.post(`/pulls/${pullRequestNumber}/reviews`, {
            body,
            event,
            comments,
        });
    }

    validateSecret(req: Request, secret: string) {
        const signature = req.header("X-Gitea-Signature");
        const request = req as Request & { rawBody?: Buffer };

        if (!signature || !request.rawBody) return false;

        const expectedSignature = crypto.createHmac("sha256", secret)
            .update(request.rawBody)
            .digest("hex");
        const expected = Buffer.from(expectedSignature, "hex");
        const provided = Buffer.from(signature, "hex");

        return crypto.timingSafeEqual(expected, provided);
    }
}

export default Gitea;
