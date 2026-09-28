import { describe, expect, test } from "bun:test";
import path from "node:path";
import { ChannelSettings } from "../src/settings/channelSettings.ts";
import { tempDir } from "./helpers.ts";

describe("ChannelSettings", () => {
    test("defaults to English and remembers per-channel languages", () => {
        const settings = new ChannelSettings(":memory:");
        expect(settings.getLang("1")).toBe("en");
        settings.setLang("1", "de");
        settings.setLang("1", "pl");
        expect(settings.getLang("1")).toBe("pl");
        expect(settings.getLang("2")).toBe("en");
    });

    test("remembers the last deck per channel", () => {
        const settings = new ChannelSettings(":memory:");
        expect(settings.getLastDeck("1")).toBeNull();
        settings.setLastDeck("1", "https://www.playgwent.com/en/decks/guides/1");
        settings.setLastDeck("1", "https://www.playgwent.com/en/decks/guides/2");
        expect(settings.getLastDeck("1")).toBe("https://www.playgwent.com/en/decks/guides/2");
        expect(settings.getLastDeck("2")).toBeNull();
    });

    test("persists across restarts", () => {
        const file = path.join(tempDir(), "nested", "bot.sqlite");
        const first = new ChannelSettings(file);
        first.setLang("42", "jp");
        first.setLastDeck("42", "https://www.playgwent.com/en/decks/abc123");
        first.close();

        const second = new ChannelSettings(file);
        expect(second.getLang("42")).toBe("jp");
        expect(second.getLastDeck("42")).toBe("https://www.playgwent.com/en/decks/abc123");
        expect(second.size).toBe(1);
        second.close();
    });
});
