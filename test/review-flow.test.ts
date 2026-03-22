import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => {
    const getDiff = vi.fn();
    const postReview = vi.fn();
    const info = vi.fn();
    const warn = vi.fn();
    const error = vi.fn();
    const generateText = vi.fn();

    class MockGitea {
        baseUrl: string;
        token: string;

        constructor(baseUrl: string, token: string) {
            this.baseUrl = baseUrl;
            this.token = token;
        }

        getDiff = getDiff;
        postReview = postReview;
    }

    return {
        getDiff,
        postReview,
        info,
        warn,
        error,
        generateText,
        MockGitea,
    };
});

vi.mock("../src/provider/google", () => ({
    model: {},
}));

vi.mock("../src/logger", () => ({
    default: {
        info: mocks.info,
        warn: mocks.warn,
        error: mocks.error,
    },
}));

vi.mock("../src/gitea", () => ({
    default: mocks.MockGitea,
}));

vi.mock("../src/config", () => ({
    config: {
        GITEA_URL: "http://gitea.test",
        GITEA_TOKEN: "token",
        GITEA_WEBHOOK_SECRET: "secret",
        GOOGLE_GENERATIVE_AI_API_KEY: "key",
        BOT_NAME: "AI",
        PORT: 4000,
        ENDPOINT: "0.0.0.0",
        REQUEST_CHANGES_THRESHOLD: 8,
    },
}));

vi.mock("ai", () => ({
    generateText: mocks.generateText,
    Output: {
        object: ({ schema }: { schema: unknown }) => ({ schema }),
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

test("review flow posts the review for the targeted bot", async () => {
    mocks.getDiff.mockResolvedValue("diff --git a/src/app.ts b/src/app.ts");
    mocks.generateText.mockResolvedValue({
        output: {
            files: [
                {
                    path: "src/app.ts",
                    comments: [{ line: 12, body: "Extract this into a helper" }],
                    score: 7,
                },
            ],
            overallScore: 9,
            summary: "Looks good overall",
        },
    });

    const { review } = await import("../src/review");

    const response = {
        statusCode: 0,
        body: "",
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        send(body: string) {
            this.body = body;
            return this;
        },
    };

    await review(
        {
            body: {
                action: "review_requested",
                requested_reviewer: {
                    username: "AI",
                },
                pull_request: {
                    number: 12,
                    base: {
                        repo: {
                            full_name: "admin/web",
                        },
                    },
                },
            },
        } as never,
        response as never,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("Event received. Processing review...");
    expect(mocks.getDiff.mock.calls).toEqual([[12]]);
    expect(mocks.postReview.mock.calls).toEqual([
        [
            12,
            "Looks good overall",
            "APPROVE",
            [
                {
                    path: "src/app.ts",
                    new_position: 12,
                    body: "Extract this into a helper",
                },
            ],
        ],
    ]);
    expect(mocks.info.mock.calls.some(([message]) => String(message).includes("{repo=admin/web pr=12} result=posted score=9"))).toBe(true);
});
