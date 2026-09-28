import { describe, expect, test } from "bun:test";
import path from "node:path";
import { buildDeckEmbed } from "../src/decks/embed.ts";
import { fetchDeck, normalizeDeckUrl, parseDeckPage } from "../src/decks/playgwent.ts";
import { must } from "./helpers.ts";

// A playgwent.com guide page trimmed to the #root state the bot reads.
const html = await Bun.file(path.join(import.meta.dir, "fixtures/deck-guide.html")).text();

describe("normalizeDeckUrl", () => {
    test("rewrites the language to the site's code for that locale", () => {
        const guide = "https://www.playgwent.com/en/decks/guides/408094";
        expect(normalizeDeckUrl(guide, "de")).toBe("https://www.playgwent.com/de/decks/guides/408094");
        expect(normalizeDeckUrl(guide, "jp")).toBe("https://www.playgwent.com/ja/decks/guides/408094");
        expect(normalizeDeckUrl(guide, "cn")).toBe("https://www.playgwent.com/zh-cn/decks/guides/408094");
        expect(normalizeDeckUrl(guide, "pt")).toBe("https://www.playgwent.com/pt-BR/decks/guides/408094");
        expect(normalizeDeckUrl(guide, "mx")).toBe("https://www.playgwent.com/es/decks/guides/408094");
    });

    test("accepts shared deck links and localized links", () => {
        expect(normalizeDeckUrl("https://playgwent.com/pt-BR/decks/a1b2c3d4", "en")).toBe(
            "https://www.playgwent.com/en/decks/a1b2c3d4",
        );
    });

    test("rejects other links", () => {
        expect(normalizeDeckUrl("https://www.playgwent.com/en/decks/builder", "en")).toBeNull();
        expect(normalizeDeckUrl("https://example.com/en/decks/guides/1", "en")).toBeNull();
        expect(normalizeDeckUrl("not a url", "en")).toBeNull();
    });
});

describe("parseDeckPage", () => {
    test("reads the deck from the page state", () => {
        const deck = must(parseDeckPage(html), "the fixture deck");
        expect(deck.leader.localizedName).toBe("Unermesslicher Hunger");
        expect(deck.stratagem?.localizedName).toBe("Verfluchte Schriftrolle");
        expect(deck.cards).toHaveLength(19);
    });

    test("returns null for pages without a deck", () => {
        expect(parseDeckPage("<html><body><div id='root'></div></body></html>")).toBeNull();
        expect(parseDeckPage("<html><body></body></html>")).toBeNull();
    });
});

describe("fetchDeck", () => {
    test("returns null instead of throwing when the site can't be reached", async () => {
        // Port 9 (discard) is closed on practically every machine, so the connection is refused.
        expect(await fetchDeck("http://127.0.0.1:9/en/decks/guides/1")).toBeNull();
    });
});

describe("buildDeckEmbed", () => {
    test("summarizes the deck", () => {
        const deck = must(parseDeckPage(html), "the fixture deck");
        const embed = buildDeckEmbed(deck, "https://www.playgwent.com/de/decks/guides/408094").toJSON();
        expect(embed.title).toBe("Unermesslicher Hunger");
        expect(embed.fields?.map(f => f.name)).toEqual(["Stratagem", "Golds", "Bronzes"]);

        const [, goldsField, bronzesField] = embed.fields ?? [];
        const golds = must(goldsField, "a Golds field").value.split("\n");
        expect(golds[0]).toBe("Dagon: Prophezeit"); // highest provisions first
        expect(golds.every(line => !/^\dx /.test(line))).toBe(true); // no counts on golds
        expect(must(bronzesField, "a Bronzes field").value).toMatch(/^\dx /); // this deck has duplicate bronzes
        expect(embed.footer?.text).toBe("166 provisions · 7900 scraps");
    });
});
