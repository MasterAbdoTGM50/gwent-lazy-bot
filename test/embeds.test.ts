import { describe, expect, test } from "bun:test";
import { buildCardEmbed, buildMemeCardEmbed } from "../src/cards/embeds.ts";
import { LOCALES } from "../src/locales.ts";
import { fixtureCards, must } from "./helpers.ts";

const cards = fixtureCards();
const byId = (id: number) =>
    must(
        cards.find(c => c.id === id),
        `fixture card ${id}`,
    );

describe("card embeds", () => {
    test("every fixture card builds a valid embed in every language", () => {
        // toJSON() runs discord.js's validation (empty fields, length limits).
        for (const card of cards) {
            for (const locale of LOCALES) {
                expect(() => buildCardEmbed(card, locale).toJSON()).not.toThrow();
                expect(() => buildMemeCardEmbed(card, locale).toJSON()).not.toThrow();
            }
        }
    });

    test("units show faction, rarity, type, stats and flavor", () => {
        const embed = buildCardEmbed(byId(112101), "en").toJSON();
        expect(embed.title).toBe("Ciri - Witcher");
        expect(embed.url).toBe("https://gwent.one/en/card/112101");
        expect(embed.author?.name).toBe("Neutral - Legendary Unit");
        expect(embed.fields?.[0]?.value).toBe("Provision: 9\nPower: 6");
        expect(embed.fields?.[1]?.value).toStartWith("*");
        expect(embed.thumbnail?.url).toBe("https://gwent.one/image/gwent/assets/card/art/medium/1007.jpg");
    });

    test("leaders show only the ability, with the ability icon", () => {
        const embed = buildCardEmbed(byId(202572), "en").toJSON();
        expect(embed.author?.name).toBe("Monsters");
        expect(embed.fields ?? []).toHaveLength(0);
        expect(embed.thumbnail?.url).toBe("https://gwent.one/img/icon/ability/202572.png");
    });

    test("cards without a category have no dangling separator", () => {
        expect(buildCardEmbed(byId(112403), "en").toJSON().title).toBe("Duda: Companion");
    });

    test("dual-faction cards list both factions", () => {
        expect(buildCardEmbed(byId(202294), "en").toJSON().author?.name).toStartWith("Syndicate & Nilfgaard");
    });

    test("uses the channel's language", () => {
        expect(buildCardEmbed(byId(112103), "de").toJSON().title).toStartWith("Geralt von Riva");
    });
});
