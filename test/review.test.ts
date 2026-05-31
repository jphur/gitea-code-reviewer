import { beforeEach, expect, test, vi } from "vitest";
import { review } from "../src/core/review";
import { createMockResponse } from "./helpers";

const { getDiff, postReview, generateText } = vi.hoisted(() => {
    const getDiff = vi.fn();
    const postReview = vi.fn();
    const generateText = vi.fn();
    return { getDiff, postReview, generateText };
});

vi.mock("../src/core/gitea", () => ({
    default: class { getDiff = getDiff; postReview = postReview; }
}));

vi.mock("../src/provideer", () => ({ model: {} }));
vi.mock("../src/config", () => ({
    config: {
        GITEA_URL: "http://localhost:3000",
        GITEA_TOKEN: "test-token",
        FORCE_BY_FILE: false,
        MAX_CHAR_DIFF: 50000,
        REQUEST_CHANGES_THRESHOLD: 0.5,
        AI_MAX_OUTPUT_TOKENS: 2000,
        AI_TIMEOUT_MS: 30000
    }
}));
vi.mock("ai", () => ({ generateText, Output: { object: ({ schema }: { schema: unknown }) => ({ schema }) } }));

beforeEach(() => vi.clearAllMocks());

const mockOutput = (path: string, score: number, summary: string) => ({
    output: {
        files: [{
            path,
            comments: [{ line: 2, body: "Issue" }],
            score
        }],
        overallScore: score, summary
    }
});

test("review() runs review flow successfully", async () => {
    getDiff.mockResolvedValue("diff");
    generateText.mockResolvedValue(mockOutput("main.ts", 0.9, "Good"));
    const req = { body: { pull_request: { number: 42, base: { repo: { full_name: "test/repo" } } } } } as any;
    const res = createMockResponse();
    await review(req, res);
    expect(postReview).toHaveBeenCalledWith(42, "Good", "APPROVE", expect.any(Array));
});

test("review() handles multiple files", async () => {
    const large = Array(10000).fill("+ code\n").join("");
    getDiff.mockResolvedValue(`diff --git a/file1.ts\n${large}diff --git a/file2.ts\n${large}`);
    generateText.mockResolvedValueOnce(mockOutput("file1.ts", 0.3, "Bad")).mockResolvedValueOnce(mockOutput("file2.ts", 0.4, "Worse"));
    const res = createMockResponse();
    await review({ body: { pull_request: { number: 99, base: { repo: { full_name: "test/repo" } } } } } as any, res);
    expect(postReview).toHaveBeenCalledWith(99, expect.stringContaining("Bad"), "REQUEST_CHANGES", expect.any(Array));
});
