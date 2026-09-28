import path from "node:path";

type Env = Record<string, string | undefined>;

/** The bot author, used when OWNER_IDS isn't set. */
const DEFAULT_OWNER_IDS = ["179631031337484288"];
/** The project folder, so paths don't depend on where the bot is started from. */
export const APP_ROOT = path.resolve(import.meta.dir, "..");
const DEFAULT_DATA_DIR = "storage";
/** gwent.one's public API key. */
export const DEFAULT_GWENT_API_KEY = "data";
const DATABASE_FILE = "bot.sqlite";
const CARD_CACHE_FILE = path.join("cache", "cards.json");

/** Everything except the Discord token, so scripts that don't talk to Discord can use it too. */
export interface Settings {
    /** Discord user IDs allowed to change any channel's language. */
    ownerIds: string[];
    paths: {
        /** Everything the bot writes. A relative DATA_DIR is resolved against the project folder. */
        dataDir: string;
        /** Settings users made; back this up. */
        database: string;
        /** Downloaded card data; safe to delete, it's downloaded again. */
        cardCache: string;
    };
    gwentApiKey: string;
}

export interface Config extends Settings {
    token: string;
}

function csv(value: string | undefined): string[] | undefined {
    const items = value
        ?.split(",")
        .map(s => s.trim())
        .filter(Boolean);
    return items?.length ? items : undefined;
}

export function loadSettings(env: Env = process.env): Settings {
    const dataDir = path.resolve(APP_ROOT, env.DATA_DIR || DEFAULT_DATA_DIR);
    return {
        ownerIds: csv(env.OWNER_IDS) ?? DEFAULT_OWNER_IDS,
        paths: {
            dataDir,
            database: path.join(dataDir, DATABASE_FILE),
            cardCache: path.join(dataDir, CARD_CACHE_FILE),
        },
        gwentApiKey: env.GWENT_API_KEY || DEFAULT_GWENT_API_KEY,
    };
}

export function loadConfig(env: Env = process.env): Config {
    const token = env.DISCORD_TOKEN;
    if (!token) {
        throw new Error("DISCORD_TOKEN is not set (see .env.example)");
    }
    return { ...loadSettings(env), token };
}
