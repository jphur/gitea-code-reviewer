import { vi } from "vitest";

vi.mock("../src/config", () => ({
    config: {
        GITEA_URL: "http://gitea.test",
        GITEA_TOKEN: "token",
        GITEA_WEBHOOK_SECRET: "secret",
        BOT_NAME: "AI",
        REQUEST_CHANGES_THRESHOLD: 8,
        AI_TIMEOUT_MS: 60000,
    },
}));

vi.mock("../src/core/logger", () => ({
    default: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));
