import { beforeEach, describe, expect, test } from "bun:test";
import path from "node:path";
import type { ChatInputCommandInteraction } from "discord.js";
import { deck } from "../src/commands/deck.ts";
import type { BotContext } from "../src/context.ts";
import { parseDeckPage } from "../src/decks/playgwent.ts";
import { ChannelSettings } from "../src/settings/channelSettings.ts";

const deckFixture = parseDeckPage(await Bun.file(path.join(import.meta.dir, "fixtures/deck-guide.html")).text());
const fetched: string[] = [];
/** Stands in for playgwent.com: records the URL and returns the fixture deck. */
async function fakeFetchDeck(url: string) {
    fetched.push(url);
    return deckFixture;
}

/** Just enough of an interaction for /deck, recording what the bot replied. */
function fakeInteraction(link: string | null, channelId = "chan") {
    const replies: { ephemeral: boolean; content?: string; embedTitle?: string }[] = [];
    const record = (ephemeral: boolean) => async (payload: any) => {
        replies.push(
            typeof payload === "string"
                ? { ephemeral, content: payload }
                : { ephemeral, content: payload.content, embedTitle: payload.embeds?.[0]?.toJSON().title },
        );
    };
    const interaction = {
        channelId,
        options: { getString: () => link },
        reply: async (payload: any) => record(Boolean(payload.flags))(payload),
        deferReply: async () => {},
        editReply: record(false),
    } as unknown as ChatInputCommandInteraction;
    return { interaction, replies };
}

describe("/deck", () => {
    let ctx: BotContext;
    beforeEach(() => {
        fetched.length = 0;
        ctx = {
            settings: new ChannelSettings(":memory:"),
            ownerIds: [],
            cards: null as never,
            fetchDeck: fakeFetchDeck,
        };
    });

    test("without a link and no history, explains how to use it", async () => {
        const { interaction, replies } = fakeInteraction(null);
        await deck.execute(interaction, ctx);
        expect(replies).toEqual([{ ephemeral: true, content: expect.stringContaining("No deck has been shown") }]);
        expect(fetched).toEqual([]);
    });

    test("with a link, shows the deck and remembers it for the channel", async () => {
        const { interaction, replies } = fakeInteraction("https://www.playgwent.com/en/decks/guides/408094");
        await deck.execute(interaction, ctx);
        expect(replies).toEqual([{ ephemeral: false, content: undefined, embedTitle: "Unermesslicher Hunger" }]);
        expect(ctx.settings.getLastDeck("chan")).toBe("https://www.playgwent.com/en/decks/guides/408094");
    });

    test("without a link, repeats the channel's last deck in the channel's current language", async () => {
        ctx.settings.setLastDeck("chan", "https://www.playgwent.com/en/decks/guides/408094");
        ctx.settings.setLang("chan", "jp");
        const { interaction, replies } = fakeInteraction(null);
        await deck.execute(interaction, ctx);
        expect(fetched).toEqual(["https://www.playgwent.com/ja/decks/guides/408094"]);
        expect(replies[0]?.embedTitle).toBe("Unermesslicher Hunger");
    });

    test("an invalid link is rejected and doesn't replace the last deck", async () => {
        ctx.settings.setLastDeck("chan", "https://www.playgwent.com/en/decks/guides/1");
        const { interaction, replies } = fakeInteraction("https://example.com/nope");
        await deck.execute(interaction, ctx);
        expect(replies[0]).toMatchObject({ ephemeral: true });
        expect(ctx.settings.getLastDeck("chan")).toBe("https://www.playgwent.com/en/decks/guides/1");
    });

    test("a deck that can't be read gets a clear message and isn't remembered", async () => {
        ctx.fetchDeck = async () => null;
        const { interaction, replies } = fakeInteraction("https://www.playgwent.com/en/decks/guides/408094");
        await deck.execute(interaction, ctx);
        expect(replies).toEqual([{ ephemeral: false, content: expect.stringContaining("Couldn't read a deck") }]);
        expect(ctx.settings.getLastDeck("chan")).toBeNull();
    });

    test("last decks are per channel", async () => {
        ctx.settings.setLastDeck("other", "https://www.playgwent.com/en/decks/guides/1");
        const { interaction, replies } = fakeInteraction(null, "chan");
        await deck.execute(interaction, ctx);
        expect(replies[0]?.content).toContain("No deck has been shown");
    });
});
