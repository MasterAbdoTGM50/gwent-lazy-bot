import { describe, expect, test } from "bun:test";
import { truncate } from "../src/discord/limits.ts";

describe("truncate", () => {
    test("leaves short text alone", () => {
        expect(truncate("Ciri", 10)).toBe("Ciri");
        expect(truncate("0123456789", 10)).toBe("0123456789");
    });

    test("cuts long text to the limit, including the ellipsis", () => {
        const cut = truncate("0123456789AB", 10);
        expect(cut).toBe("012345678…");
        expect(cut).toHaveLength(10);
    });
});
