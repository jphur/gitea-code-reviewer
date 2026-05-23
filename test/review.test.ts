import { beforeEach, expect, test, vi } from "vitest";
import { review } from "../src/core/review";
import { createMockResponse } from "./helpers";

const mocks = vi.hoisted(() => {
    const getDiff = vi.fn();
    const postReview = vi.fn();
    const generateText = vi.fn();

    return {
        getDiff,
        postReview,
        generateText,
        MockGitea: class {
            getDiff = getDiff;
            postReview = postReview;
        }
    };
});

vi.mock("../src/core/gitea", () => ({
    default: mocks.MockGitea,
}));

vi.mock("../src/provideer", () => ({
    model: {},
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


test("review() runs review flow successfully", async () => {
    mocks.getDiff.mockResolvedValue("diff content");
    mocks.generateText.mockResolvedValue({
        output: {
            files: [
                {
                    path: "main.ts",
                    comments: [{ line: 5, body: "Cool" }],
                    score: 9
                }
            ],
            overallScore: 9,
            summary: "Looks good"
        }
    });

    const req = {
        body: {
            action: "review_requested",
            requested_reviewer: { username: "AI" },
            pull_request: {
                number: 42,
                base: { repo: { full_name: "test/repo" } }
            }
        }
    } as any;
    const res = createMockResponse();

    await review(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith("Event received. Processing review...");
    expect(mocks.getDiff).toHaveBeenCalledWith(42);
    expect(mocks.postReview).toHaveBeenCalledWith(42, "Looks good", "APPROVE", [
        { path: "main.ts", new_position: 5, body: "Cool" }
    ]);
});
