import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import type { GwentApi, RawCard } from "../src/cards/api.ts";
import { mergeCardLists } from "../src/cards/parse.ts";
import { CardStore } from "../src/cards/store.ts";
import type { Card } from "../src/cards/types.ts";
import type { GwentLocale } from "../src/locales.ts";
import fixture from "./fixtures/cards.json";

/** A handful of real cards (en + de) from api.gwent.one, trimmed to the fields the bot reads. */
export const rawCards = fixture as unknown as { version: string; en: RawCard[]; de: RawCard[] };

/** Returns the value, or fails the test with a clear message when it's missing. */
export function must<T>(value: T | null | undefined, what: string): T {
    if (value === null || value === undefined) {
        throw new Error(`Expected ${what}, got ${value}`);
    }
    return value;
}

export function fixtureLists(): Map<GwentLocale, RawCard[]> {
    return new Map<GwentLocale, RawCard[]>([
        ["en", rawCards.en],
        ["de", rawCards.de],
    ]);
}

export function fixtureCards(): Card[] {
    return mergeCardLists(fixtureLists());
}

export function tempDir(): string {
    return mkdtempSync(path.join(tmpdir(), "lazy-bot-test-"));
}

/** A fake gwent.one that serves the fixture for every language and records its calls. */
export function fakeApi(version = rawCards.version) {
    const calls: string[] = [];
    const api: GwentApi & { version: string; fail: boolean; calls: string[] } = {
        version,
        fail: false,
        calls,
        async fetchLatestVersion() {
            calls.push("version");
            if (api.fail) {
                throw new Error("gwent.one is down");
            }
            return api.version;
        },
        async fetchCardList(locale, pinned) {
            calls.push(`${locale}@${pinned}`);
            if (api.fail) {
                throw new Error("gwent.one is down");
            }
            return locale === "de" ? rawCards.de : rawCards.en;
        },
    };
    return api;
}

export async function loadedStore(): Promise<CardStore> {
    const store = new CardStore(fakeApi(), path.join(tempDir(), "cards.json"), { minCards: 1, retryDelayMs: 0 });
    await store.checkForUpdate();
    return store;
}
