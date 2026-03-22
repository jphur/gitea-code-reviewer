import { expect, test } from "vitest";
import { reviewSchema } from "../src/schemas/review";

test("review schema parses the expected shape", () => {
    const parsed = reviewSchema.parse({
        files: [
            {
                path: "src/app.ts",
                comments: [{ line: 12, body: "Extract this into a helper" }],
                score: 7,
            },
        ],
        overallScore: 9,
        summary: "Looks good overall",
    });

    expect(parsed.files.length).toBe(1);
    expect(parsed.files[0].path).toBe("src/app.ts");
    expect(parsed.files[0].comments[0].line).toBe(12);
    expect(parsed.overallScore).toBe(9);
    expect(parsed.summary).toBe("Looks good overall");
});
