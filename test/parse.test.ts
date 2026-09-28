import { describe, expect, test } from "bun:test";
import { mergeCardLists } from "../src/cards/parse.ts";
import { fixtureCards, must, rawCards } from "./helpers.ts";

const cards = fixtureCards();
const byId = (id: number) =>
    must(
        cards.find(c => c.id === id),
        `fixture card ${id}`,
    );

describe("mergeCardLists", () => {
    test("maps api.gwent.one fields onto the bot's card shape", () => {
        expect(byId(112101)).toMatchObject({
            id: 112101,
            art: 1007,
            faction: "neutral",
            secondaryFaction: null,
            color: "gold",
            rarity: "legendary",
            type: "unit",
            provisions: 9,
            power: 6,
            armor: 0,
        });
    });

    test("treats Ability cards as leaders", () => {
        expect(byId(122105).type).toBe("leader");
    });

    test("keeps both factions of dual-faction cards", () => {
        expect(byId(202294)).toMatchObject({ faction: "syndicate", secondaryFaction: "nilfgaard" });
    });

    test("uses each language's text, falling back to English when missing", () => {
        const geralt = byId(112103);
        expect(geralt.name.en).toBe("Geralt of Rivia");
        expect(geralt.name.de).toBe("Geralt von Riva");
        expect(geralt.name.pl).toBe("Geralt of Rivia"); // not in the fixture, so English
    });

    test("unknown values from gwent.one fall back instead of failing the update", () => {
        const raw = must(rawCards.en[0], "a fixture card");
        const odd = {
            ...raw,
            attributes: { ...raw.attributes, faction: "Wild Hunt", rarity: "Mythic", type: "Relic" },
        };
        const [card] = mergeCardLists(new Map([["en", [odd]]]));
        expect(card).toMatchObject({ faction: "neutral", rarity: "common", type: "special" });
    });
});
