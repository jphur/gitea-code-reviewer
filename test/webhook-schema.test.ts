import { expect, test } from "vitest";
import { webhookSchema } from "../src/schemas/webhook";

test("webhook schema parses review_requested payloads", () => {
    const parsed = webhookSchema.parse({
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
    });

    expect(parsed.action).toBe("review_requested");
    expect(parsed.requested_reviewer?.username).toBe("AI");
    expect(parsed.pull_request?.number).toBe(12);
    expect(parsed.pull_request?.base.repo.full_name).toBe("admin/web");
});

test("webhook schema rejects malformed payloads", () => {
    const parsed = webhookSchema.safeParse({
        action: "review_requested",
        requested_reviewer: {
            username: "AI",
        },
        pull_request: {
            number: "12",
            base: {
                repo: {
                    full_name: "admin/web",
                },
            },
        },
    });

    expect(parsed.success).toBe(false);
});
