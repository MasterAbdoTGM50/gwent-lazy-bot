import { describe, expect, test } from "bun:test";
import path from "node:path";
import { APP_ROOT, loadConfig, loadSettings } from "../src/config.ts";

describe("config", () => {
    test("defaults", () => {
        const settings = loadSettings({});
        expect(settings.paths.dataDir).toBe(path.join(APP_ROOT, "storage"));
        expect(settings.paths.database).toBe(path.join(APP_ROOT, "storage", "bot.sqlite"));
        expect(settings.paths.cardCache).toBe(path.join(APP_ROOT, "storage", "cache", "cards.json"));
        expect(settings.gwentApiKey).toBe("data");
        expect(settings.ownerIds.length).toBeGreaterThan(0);
    });

    test("reads overrides from the environment", () => {
        const settings = loadSettings({ DATA_DIR: "/srv/bot", OWNER_IDS: " 1, 2 ,,", GWENT_API_KEY: "secret" });
        expect(settings.paths.database).toBe("/srv/bot/bot.sqlite");
        expect(settings.ownerIds).toEqual(["1", "2"]);
        expect(settings.gwentApiKey).toBe("secret");
    });

    test("paths don't depend on the working directory", () => {
        expect(APP_ROOT).toBe(path.resolve(import.meta.dir, ".."));
        expect(loadSettings({ DATA_DIR: "elsewhere" }).paths.dataDir).toBe(path.join(APP_ROOT, "elsewhere"));
    });

    test("the bot's config requires a token; settings don't", () => {
        expect(() => loadConfig({})).toThrow("DISCORD_TOKEN");
        expect(loadConfig({ DISCORD_TOKEN: "t" }).token).toBe("t");
        expect(() => loadSettings({})).not.toThrow();
    });
});
