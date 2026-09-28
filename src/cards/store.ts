import { mkdir, rename } from "node:fs/promises";
import path from "node:path";
import { type GwentLocale, LOCALES } from "../locales.ts";
import { log } from "../log.ts";
import { SECOND } from "../time.ts";
import type { GwentApi, RawCard } from "./api.ts";
import { Lisa } from "./lisa.ts";
import { mergeCardLists } from "./parse.ts";
import { CARD_CACHE_FORMAT, type Card, type CardCache } from "./types.ts";

/** Tries per language download before the whole update is abandoned. */
const DOWNLOAD_ATTEMPTS = 3;
/** Base pause between those tries; it grows with each attempt. */
const DEFAULT_RETRY_DELAY_MS = 5 * SECOND;
/** Fewer English cards than this means a broken response (the game has ~1,400). */
const DEFAULT_MIN_CARDS = 500;
/** Every language must return at least this share of the English card count. */
const MIN_TRANSLATION_COVERAGE = 0.9;

export type UpdateResult =
    | { status: "up-to-date"; version: string }
    | { status: "updated"; version: string; previous: string | null; cards: number };

export interface CardStoreOptions {
    /** Pause between retries of a failed language download. */
    retryDelayMs?: number;
    /** Reject a download with fewer cards than this, to avoid replacing good data with a broken response. */
    minCards?: number;
}

/** Where the version before the current one is kept: `cards.json` → `cards.previous.json`. */
export function previousCachePath(cachePath: string): string {
    const { dir, name, ext } = path.parse(cachePath);
    return path.join(dir, `${name}.previous${ext}`);
}

/**
 * Holds the current card list and the per-language search indexes.
 *
 * Cards are cached to disk with the game version they belong to, so a restart serves the cached
 * data immediately and only re-downloads when api.gwent.one reports a newer version. The version
 * before it is kept next to it (see previousCachePath) for comparing patches later; the bot never
 * loads it.
 */
export class CardStore {
    #byId = new Map<number, Card>();
    #indexes = new Map<GwentLocale, Lisa<Card, number>>();
    #version: string | null = null;
    #inFlight: Promise<UpdateResult> | null = null;

    readonly #api: GwentApi;
    readonly #cachePath: string;
    readonly #retryDelayMs: number;
    readonly #minCards: number;

    constructor(api: GwentApi, cachePath: string, options: CardStoreOptions = {}) {
        this.#api = api;
        this.#cachePath = cachePath;
        this.#retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
        this.#minCards = options.minCards ?? DEFAULT_MIN_CARDS;
    }

    get version(): string | null {
        return this.#version;
    }
    get size(): number {
        return this.#byId.size;
    }
    get ready(): boolean {
        return this.#byId.size > 0;
    }

    byId(id: number): Card | undefined {
        return this.#byId.get(id);
    }

    search(locale: GwentLocale, query: string): Card[] {
        return this.#indexes.get(locale)?.findByAlias(query) ?? [];
    }

    /** Loads the on-disk cache, if any. Returns whether cards were loaded. */
    async loadCache(): Promise<boolean> {
        const file = Bun.file(this.#cachePath);
        if (!(await file.exists())) {
            return false;
        }
        try {
            const cache = (await file.json()) as CardCache;
            if (cache.format !== CARD_CACHE_FORMAT) {
                log.info(
                    `Card cache format ${cache.format ?? "(none)"} is outdated (now ${CARD_CACHE_FORMAT}); re-downloading`,
                );
                return false;
            }
            if (!cache.version || !Array.isArray(cache.cards) || cache.cards.length === 0) {
                throw new Error("cache is missing its version or cards");
            }
            this.#apply(cache);
            log.info(`Loaded ${cache.cards.length} cards for game version ${cache.version} from cache`);
            return true;
        } catch (err) {
            log.warn(`Ignoring unreadable card cache at ${this.#cachePath}:`, err);
            return false;
        }
    }

    /**
     * Downloads the card list if api.gwent.one serves a different version than the one loaded
     * (or unconditionally with `force`). Concurrent calls share the same in-flight update.
     */
    checkForUpdate({ force = false } = {}): Promise<UpdateResult> {
        this.#inFlight ??= this.#update(force).finally(() => {
            this.#inFlight = null;
        });
        return this.#inFlight;
    }

    async #update(force: boolean): Promise<UpdateResult> {
        const latest = await this.#api.fetchLatestVersion();
        if (!force && latest === this.#version) {
            return { status: "up-to-date", version: latest };
        }

        log.info(`Downloading cards for game version ${latest} (current: ${this.#version ?? "none"})`);
        const lists = new Map<GwentLocale, RawCard[]>();
        for (const locale of LOCALES) {
            // Every language is pinned to the probed version so a patch landing mid-download can't mix versions.
            lists.set(
                locale,
                await this.#withRetry(() => this.#api.fetchCardList(locale, latest), `${locale} card list`),
            );
        }
        this.#validate(lists);

        const cache: CardCache = {
            format: CARD_CACHE_FORMAT,
            version: latest,
            fetchedAt: new Date().toISOString(),
            cards: mergeCardLists(lists),
        };
        await this.#writeCache(cache);

        const previous = this.#version;
        this.#apply(cache);
        log.info(`Now serving ${cache.cards.length} cards for game version ${latest}`);
        return { status: "updated", version: latest, previous, cards: cache.cards.length };
    }

    #validate(lists: Map<GwentLocale, RawCard[]>): void {
        const enCount = lists.get("en")?.length ?? 0;
        if (enCount < this.#minCards) {
            throw new Error(`Refusing card update: only ${enCount} English cards returned`);
        }
        for (const [locale, cards] of lists) {
            if (cards.length < enCount * MIN_TRANSLATION_COVERAGE) {
                throw new Error(
                    `Refusing card update: ${locale} returned ${cards.length} cards vs ${enCount} in English`,
                );
            }
        }
    }

    async #withRetry<T>(fn: () => Promise<T>, what: string, attempts = DOWNLOAD_ATTEMPTS): Promise<T> {
        for (let attempt = 1; ; ++attempt) {
            try {
                return await fn();
            } catch (err) {
                if (attempt >= attempts) {
                    throw err;
                }
                log.warn(`Fetching ${what} failed (attempt ${attempt}/${attempts}), retrying:`, err);
                await Bun.sleep(this.#retryDelayMs * attempt);
            }
        }
    }

    /**
     * Writes to a temporary file and renames it over the cache, so a crash can't leave it
     * half-written. When the game version changes, the old file becomes the previous version
     * first; re-downloading the same version leaves the previous one alone.
     */
    async #writeCache(cache: CardCache): Promise<void> {
        await mkdir(path.dirname(this.#cachePath), { recursive: true });
        const tmp = `${this.#cachePath}.tmp`;
        await Bun.write(tmp, JSON.stringify(cache));

        const replaced = await this.#storedVersion();
        if (replaced && replaced !== cache.version) {
            await rename(this.#cachePath, previousCachePath(this.#cachePath));
            log.info(`Kept game version ${replaced} as the previous card data`);
        }
        await rename(tmp, this.#cachePath);
    }

    /** The game version in the cache file, even one in an outdated format, or null if there's none. */
    async #storedVersion(): Promise<string | null> {
        try {
            const { version } = (await Bun.file(this.#cachePath).json()) as Partial<CardCache>;
            return typeof version === "string" ? version : null;
        } catch {
            return null; // missing or unreadable: nothing worth keeping
        }
    }

    #apply(cache: CardCache): void {
        this.#byId = new Map(cache.cards.map(card => [card.id, card]));
        this.#indexes = new Map(
            LOCALES.map(locale => [
                locale,
                new Lisa(
                    cache.cards,
                    card => card.id,
                    card => card.name[locale],
                ),
            ]),
        );
        this.#version = cache.version;
    }
}
