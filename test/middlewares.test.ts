import { beforeEach, describe, expect, test, vi } from "vitest";
import { validateReviewRequest } from "../src/api/middlewares";
import { createMockResponse } from "./helpers";

const mocks = vi.hoisted(() => {
    const validateSecret = vi.fn();
    return {
        validateSecret,
        MockGitea: class {
            validateSecret = validateSecret;
        }
    };
});

vi.mock("../src/core/gitea", () => ({
    default: mocks.MockGitea,
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("validateReviewRequest()", () => {
    test("invalid signature (401)", () => {
        mocks.validateSecret.mockReturnValue(false);
        const req = { body: {} } as any;
        const res = createMockResponse();
        const next = vi.fn();

        validateReviewRequest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith("Unauthorized: Invalid webhook signature");
        expect(next).not.toHaveBeenCalled();
    });

    test("invalid payload (400)", () => {
        mocks.validateSecret.mockReturnValue(true);
        const req = { body: {} } as any;
        const res = createMockResponse();
        const next = vi.fn();

        validateReviewRequest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("Invalid webhook payload");
        expect(next).not.toHaveBeenCalled();
    });

    test("review for another user (200 Ignored)", () => {
        mocks.validateSecret.mockReturnValue(true);
        const req = {
            body: {
                action: "review_requested",
                requested_reviewer: { username: "other_user" },
                pull_request: {
                    number: 1,
                    base: { repo: { full_name: "test/repo" } }
                }
            }
        } as any;
        const res = createMockResponse();
        const next = vi.fn();

        validateReviewRequest(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith("Review requested by a user other than the bot.");
        expect(next).not.toHaveBeenCalled();
    });

    test("valid request (next)", () => {
        mocks.validateSecret.mockReturnValue(true);
        const req = {
            body: {
                action: "review_requested",
                requested_reviewer: { username: "AI" },
                pull_request: {
                    number: 1,
                    base: { repo: { full_name: "test/repo" } }
                }
            }
        } as any;
        const res = createMockResponse();
        const next = vi.fn();

        validateReviewRequest(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});
