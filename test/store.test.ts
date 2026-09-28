import { describe, expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { CardStore, previousCachePath } from "../src/cards/store.ts";
import { CARD_CACHE_FORMAT } from "../src/cards/types.ts";
import { LOCALES } from "../src/locales.ts";
import { fakeApi, rawCards, tempDir } from "./helpers.ts";

const options = { minCards: 1, retryDelayMs: 0 };

describe("CardStore", () => {
    test("downloads every language pinned to the probed version when there is no cache", async () => {
        const api = fakeApi("14.8.0");
        const store = new CardStore(api, path.join(tempDir(), "cards.json"), options);

        expect(await store.loadCache()).toBe(false);
        expect(store.ready).toBe(false);

        const result = await store.checkForUpdate();
        expect(result).toEqual({ status: "updated", version: "14.8.0", previous: null, cards: rawCards.en.length });
        expect(api.calls).toEqual(["version", ...LOCALES.map(l => `${l}@14.8.0`)]);
        expect(store.ready).toBe(true);
        expect(store.version).toBe("14.8.0");
    });

    test("a restart serves the cache and skips the download when the version is unchanged", async () => {
        const cachePath = path.join(tempDir(), "cards.json");
        await new CardStore(fakeApi("14.8.0"), cachePath, options).checkForUpdate();

        const api = fakeApi("14.8.0");
        const restarted = new CardStore(api, cachePath, options);
        expect(await restarted.loadCache()).toBe(true);
        expect(restarted.search("en", "ciri dash").map(c => c.id)).toEqual([112110]);

        expect(await restarted.checkForUpdate()).toEqual({ status: "up-to-date", version: "14.8.0" });
        expect(api.calls).toEqual(["version"]);
    });

    test("re-downloads when gwent.one reports a new version", async () => {
        const cachePath = path.join(tempDir(), "cards.json");
        await new CardStore(fakeApi("14.8.0"), cachePath, options).checkForUpdate();

        const store = new CardStore(fakeApi("14.9.0"), cachePath, options);
        await store.loadCache();
        const result = await store.checkForUpdate();
        expect(result).toMatchObject({ status: "updated", version: "14.9.0", previous: "14.8.0" });

        const reloaded = new CardStore(fakeApi("14.9.0"), cachePath, options);
        await reloaded.loadCache();
        expect(reloaded.version).toBe("14.9.0");
    });

    test("a new version moves the old one to cards.previous.json", async () => {
        const cachePath = path.join(tempDir(), "cards.json");
        const previousPath = previousCachePath(cachePath);
        expect(previousPath).toBe(path.join(path.dirname(cachePath), "cards.previous.json"));

        const api = fakeApi("14.8.0");
        const store = new CardStore(api, cachePath, options);
        await store.checkForUpdate();
        expect(await Bun.file(previousPath).exists()).toBe(false);

        api.version = "14.9.0";
        await store.checkForUpdate();
        expect((await Bun.file(previousPath).json()).version).toBe("14.8.0");
        expect((await Bun.file(cachePath).json()).version).toBe("14.9.0");
    });

    test("only the current and the previous version are kept", async () => {
        const cachePath = path.join(tempDir(), "cards.json");
        const api = fakeApi();
        const store = new CardStore(api, cachePath, options);
        for (const version of ["14.8.0", "14.9.0", "14.10.0"]) {
            api.version = version;
            await store.checkForUpdate();
        }
        expect((await readdir(path.dirname(cachePath))).sort()).toEqual(["cards.json", "cards.previous.json"]);
        expect((await Bun.file(previousCachePath(cachePath)).json()).version).toBe("14.9.0");
    });

    test("re-downloading the same version keeps the previous one", async () => {
        const cachePath = path.join(tempDir(), "cards.json");
        const api = fakeApi("14.8.0");
        const store = new CardStore(api, cachePath, options);
        await store.checkForUpdate();
        api.version = "14.9.0";
        await store.checkForUpdate();

        await store.checkForUpdate({ force: true });
        expect((await Bun.file(previousCachePath(cachePath)).json()).version).toBe("14.8.0");
    });

    test("a failed update leaves both files as they were", async () => {
        const cachePath = path.join(tempDir(), "cards.json");
        const api = fakeApi("14.8.0");
        const store = new CardStore(api, cachePath, options);
        await store.checkForUpdate();
        api.version = "14.9.0";
        await store.checkForUpdate();

        api.version = "14.10.0";
        api.fail = true;
        await expect(store.checkForUpdate()).rejects.toThrow("gwent.one is down");
        expect((await Bun.file(cachePath).json()).version).toBe("14.9.0");
        expect((await Bun.file(previousCachePath(cachePath)).json()).version).toBe("14.8.0");
    });

    test("an outdated-format cache still becomes the previous version", async () => {
        const cachePath = path.join(tempDir(), "cards.json");
        await new CardStore(fakeApi("14.8.0"), cachePath, options).checkForUpdate();
        const cache = await Bun.file(cachePath).json();
        await Bun.write(cachePath, JSON.stringify({ ...cache, format: CARD_CACHE_FORMAT - 1 }));

        const store = new CardStore(fakeApi("14.9.0"), cachePath, options);
        expect(await store.loadCache()).toBe(false);
        await store.checkForUpdate();
        expect((await Bun.file(previousCachePath(cachePath)).json()).version).toBe("14.8.0");
    });

    test("force re-downloads the same version", async () => {
        const store = new CardStore(fakeApi(), path.join(tempDir(), "cards.json"), options);
        await store.checkForUpdate();
        expect((await store.checkForUpdate({ force: true })).status).toBe("updated");
    });

    test("a failed update keeps the current cards", async () => {
        const api = fakeApi("14.8.0");
        const store = new CardStore(api, path.join(tempDir(), "cards.json"), options);
        await store.checkForUpdate();

        api.version = "14.9.0";
        api.fail = true;
        expect(store.checkForUpdate()).rejects.toThrow("gwent.one is down");
        await Bun.sleep(0);
        expect(store.version).toBe("14.8.0");
        expect(store.ready).toBe(true);
    });

    test("refuses a suspiciously small download", async () => {
        const store = new CardStore(fakeApi(), path.join(tempDir(), "cards.json"), { ...options, minCards: 500 });
        expect(store.checkForUpdate()).rejects.toThrow("only");
    });

    test("concurrent checks share one download", async () => {
        const api = fakeApi();
        const store = new CardStore(api, path.join(tempDir(), "cards.json"), options);
        const [a, b] = await Promise.all([store.checkForUpdate(), store.checkForUpdate()]);
        expect(a).toBe(b);
        expect(api.calls.filter(c => c === "version")).toHaveLength(1);
    });

    test("ignores a cache written in an older format", async () => {
        const cachePath = path.join(tempDir(), "cards.json");
        await new CardStore(fakeApi(), cachePath, options).checkForUpdate();
        const cache = await Bun.file(cachePath).json();
        await Bun.write(cachePath, JSON.stringify({ ...cache, format: CARD_CACHE_FORMAT - 1 }));

        expect(await new CardStore(fakeApi(), cachePath, options).loadCache()).toBe(false);
    });

    test("ignores a corrupt cache file", async () => {
        const cachePath = path.join(tempDir(), "cards.json");
        await Bun.write(cachePath, "{not json");
        const store = new CardStore(fakeApi(), cachePath, options);
        expect(await store.loadCache()).toBe(false);
    });
});
