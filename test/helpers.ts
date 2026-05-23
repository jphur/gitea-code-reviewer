import { vi } from "vitest";

/**
 * Creates a mock Express Response object to assert status and send calls.
 */
export function createMockResponse() {
    const res: any = {};
    res.statusCode = 0;
    res.body = "";
    res.status = vi.fn().mockImplementation((code: number) => {
        res.statusCode = code;
        return res;
    });
    res.send = vi.fn().mockImplementation((body: string) => {
        res.body = body;
        return res;
    });
    return res;
}
