import { describe, expect, test } from "bun:test";
import { EmbedBuilder } from "discord.js";
import {
    chunkEmbeds,
    extractQueries,
    MAX_CARDS_PER_MESSAGE,
    resolveQueries,
    staleNicknames,
} from "../src/messages/cardMentions.ts";
import { loadedStore } from "./helpers.ts";

const store = await loadedStore();
const ids = (queries: string[], locale: Parameters<typeof resolveQueries>[2] = "en") =>
    resolveQueries(store, queries, locale).map(m => m.card.id);

describe("extractQueries", () => {
    test("pulls every bracketed name, trimmed", () => {
        expect(extractQueries("play [ciri] then [ geralt igni ] and []")).toEqual(["ciri", "geralt igni"]);
    });

    test("ignores messages without brackets", () => {
        expect(extractQueries("no cards here")).toEqual([]);
    });
});

describe("resolveQueries", () => {
    test("resolves fuzzy names", () => {
        expect(ids(["geralt igni", "lined pockets"])).toEqual([112102, 122105]);
    });

    test("an exact word wins: [geralt] is Geralt of Rivia, not Geralt: Igni", () => {
        expect(ids(["geralt"])).toEqual([112103]);
    });

    test("skips names that stay ambiguous", () => {
        expect(ids(["geralt professional igni"])).toEqual([]);
    });

    test("sends each card once", () => {
        expect(ids(["ciri dash", "Ciri: Dash"])).toEqual([112110]);
    });

    test("a nickname no longer stops the cards after it", () => {
        // Previously a nickname match returned early, dropping every later card in the message.
        expect(ids(["reddit", "ciri dash"])).toEqual([202667, 112110]);
    });

    test("the reddit nickname uses the meme embed", () => {
        expect(resolveQueries(store, ["Reddit"], "en")[0]).toMatchObject({ meme: true });
    });

    test("falls back to English names in other languages", () => {
        expect(ids(["geralt von riva"], "de")).toEqual([112103]);
        expect(ids(["lined pockets"], "de")).toEqual([122105]);
    });

    test(`caps a message at ${MAX_CARDS_PER_MESSAGE} cards`, () => {
        const queries = [
            "ciri dash",
            "ciri nova",
            "geralt igni",
            "geralt aard",
            "geralt yrden",
            "geralt axii",
            "geralt quen",
            "geralt professional",
            "lined pockets",
            "overwhelming hunger",
            "courier",
            "angry mob",
        ];
        expect(ids(queries)).toHaveLength(MAX_CARDS_PER_MESSAGE);
    });
});

describe("staleNicknames", () => {
    test("lists nicknames whose card is missing", () => {
        const nicks = new Map([
            ["frog", { id: 112101, meme: false }],
            ["ghost", { id: 1, meme: false }],
        ]);
        expect(staleNicknames(store, nicks)).toEqual(["ghost (1)"]);
    });
});

describe("chunkEmbeds", () => {
    const embed = (chars: number) => new EmbedBuilder().setDescription("x".repeat(chars));

    test("keeps small batches in one message", () => {
        expect(chunkEmbeds([embed(100), embed(100)]).map(c => c.length)).toEqual([2]);
    });

    test("splits before exceeding 6000 characters", () => {
        expect(chunkEmbeds([embed(2500), embed(2500), embed(2500)]).map(c => c.length)).toEqual([2, 1]);
    });

    test("splits after 10 embeds", () => {
        expect(chunkEmbeds(Array.from({ length: 12 }, () => embed(10))).map(c => c.length)).toEqual([10, 2]);
    });
});
