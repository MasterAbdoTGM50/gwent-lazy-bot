import { describe, expect, test } from "bun:test";
import { factionColor, NEUTRAL_COLOR } from "../src/colors.ts";

describe("factionColor", () => {
    test("gwent.one and playgwent.com spellings get the same color", () => {
        expect(factionColor("Monster")).toBe(factionColor("monsters"));
        expect(factionColor("Northern Realms")).toBe(factionColor("northernrealms"));
        expect(factionColor("Scoiatael")).toBe(factionColor("scoiatael"));
    });

    test("every faction has its own color", () => {
        const factions = ["monsters", "nilfgaard", "northernrealms", "scoiatael", "skellige", "syndicate"];
        const colors = new Set(factions.map(factionColor));
        expect(colors.size).toBe(factions.length);
        expect(colors.has(NEUTRAL_COLOR)).toBe(false);
    });

    test("neutral and unknown factions are neutral", () => {
        expect(factionColor("neutral")).toBe(NEUTRAL_COLOR);
        expect(factionColor("no such faction")).toBe(NEUTRAL_COLOR);
    });
});
