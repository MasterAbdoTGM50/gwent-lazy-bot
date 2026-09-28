import { describe, expect, test } from "bun:test";
import { Lisa } from "../src/cards/lisa.ts";
import { fixtureCards } from "./helpers.ts";

const cards = fixtureCards();
const en = new Lisa(
    cards,
    c => c.id,
    c => c.name.en,
);
const de = new Lisa(
    cards,
    c => c.id,
    c => c.name.de,
);
const names = (query: string, lisa = en) =>
    lisa
        .findByAlias(query)
        .map(c => c.name.en)
        .sort();

describe("Lisa", () => {
    test("exact names match", () => {
        expect(names("Geralt of Rivia")).toEqual(["Geralt of Rivia"]);
        expect(names("Lined Pockets")).toEqual(["Lined Pockets"]);
    });

    test("is case-insensitive and tolerant of partial words", () => {
        expect(names("geralt igni")).toEqual(["Geralt: Igni"]);
        expect(names("ciri das")).toEqual(["Ciri: Dash"]);
        expect(names("overwhelm")).toEqual(["Overwhelming Hunger"]);
    });

    test('whole words beat prefixes ("Geralt:" keeps its colon, so only Geralt of Rivia is an exact hit)', () => {
        expect(names("geralt")).toEqual(["Geralt of Rivia"]);
    });

    test("queries matching several cards equally stay ambiguous", () => {
        expect(names("geralt professional igni").length).toBeGreaterThan(1);
    });

    test("extra words narrow the match", () => {
        expect(names("ciri nova")).toEqual(["Ciri: Nova"]);
    });

    test("searches the configured language", () => {
        expect(names("geralt von riva", de)).toEqual(["Geralt of Rivia"]);
    });

    test("unknown and empty queries find nothing", () => {
        expect(names("zzzzzz")).toEqual([]);
        expect(names("   ")).toEqual([]);
    });

    test("findByKey returns the entry", () => {
        expect(en.findByKey(112101)?.name.en).toBe("Ciri");
        expect(en.findByKey(1)).toBeUndefined();
    });
});
