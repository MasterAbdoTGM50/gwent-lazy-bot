import { describe, expect, test } from "bun:test";
import { prefix, withPrefix } from "../src/log.ts";

describe("log prefix", () => {
    test("journald priority when running under systemd", () => {
        const env = { JOURNAL_STREAM: "8:12345" };
        expect(prefix("error", env)).toBe("<3>");
        expect(prefix("warn", env)).toBe("<4>");
        expect(prefix("info", env)).toBe("<6>");
    });

    test("under journald the priority is joined onto the message, with no space", () => {
        const err = new Error("boom");
        expect(withPrefix("warn", ["Card update failed:", err], { JOURNAL_STREAM: "8:1" })).toEqual([
            "<4>Card update failed:",
            err,
        ]);
    });

    test("elsewhere the timestamp stays a separate argument", () => {
        const [head, message] = withPrefix("info", ["Ready"], {});
        expect(head).toMatch(/Z INFO $/);
        expect(message).toBe("Ready");
    });

    test("timestamp and level otherwise", () => {
        expect(prefix("warn", {})).toMatch(/^\d{4}-\d\d-\d\dT[\d:.]+Z WARN $/);
    });
});
