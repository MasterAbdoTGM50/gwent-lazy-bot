import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DEFAULT_LOCALE, type GwentLocale, isLocale } from "../locales.ts";

/**
 * Per-channel preferences, stored in SQLite. Languages are mirrored in memory so the hot path
 * (every message with a [card]) never touches the disk.
 */
export class ChannelSettings {
    #db: Database;
    #langs = new Map<string, GwentLocale>();

    /** @param file a path to the SQLite file, or ":memory:" */
    constructor(file: string) {
        if (file !== ":memory:") {
            mkdirSync(path.dirname(file), { recursive: true });
        }
        this.#db = new Database(file, { create: true, strict: true });
        this.#db.run("PRAGMA journal_mode = WAL");
        this.#db.run(`CREATE TABLE IF NOT EXISTS channel_settings (
            channel_id TEXT PRIMARY KEY,
            lang       TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )`);
        this.#db.run(`CREATE TABLE IF NOT EXISTS channel_decks (
            channel_id TEXT PRIMARY KEY,
            url        TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        )`);

        const rows = this.#db
            .query<{ channel_id: string; lang: string }, []>("SELECT channel_id, lang FROM channel_settings")
            .all();
        for (const row of rows) {
            if (isLocale(row.lang)) {
                this.#langs.set(row.channel_id, row.lang);
            }
        }
    }

    get size(): number {
        return this.#langs.size;
    }

    getLang(channelId: string): GwentLocale {
        return this.#langs.get(channelId) ?? DEFAULT_LOCALE;
    }

    setLang(channelId: string, lang: GwentLocale): void {
        this.#db
            .query(`INSERT INTO channel_settings (channel_id, lang, updated_at) VALUES ($channelId, $lang, $now)
            ON CONFLICT(channel_id) DO UPDATE SET lang = excluded.lang, updated_at = excluded.updated_at`)
            .run({ channelId, lang, now: Date.now() });
        this.#langs.set(channelId, lang);
    }

    /** The last deck shown with /deck in this channel. */
    getLastDeck(channelId: string): string | null {
        return (
            this.#db
                .query<{ url: string }, [string]>("SELECT url FROM channel_decks WHERE channel_id = ?")
                .get(channelId)?.url ?? null
        );
    }

    setLastDeck(channelId: string, url: string): void {
        this.#db
            .query(`INSERT INTO channel_decks (channel_id, url, updated_at) VALUES ($channelId, $url, $now)
            ON CONFLICT(channel_id) DO UPDATE SET url = excluded.url, updated_at = excluded.updated_at`)
            .run({ channelId, url, now: Date.now() });
    }

    close(): void {
        this.#db.close();
    }
}
