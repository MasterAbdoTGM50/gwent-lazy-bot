/**
 * Downloads card data into the cache without starting the bot, e.g. to pre-warm a fresh install.
 *
 *   bun run update-cards            only if gwent.one serves a newer version than the cache
 *   bun run update-cards --force    re-download regardless
 */
import { createGwentApi } from "../src/cards/api.ts";
import { CardStore } from "../src/cards/store.ts";
import { loadSettings } from "../src/config.ts";

const { gwentApiKey, paths } = loadSettings();
const store = new CardStore(createGwentApi(gwentApiKey), paths.cardCache);

await store.loadCache();
const result = await store.checkForUpdate({ force: process.argv.includes("--force") });
console.log(
    result.status === "updated"
        ? `Cached ${result.cards} cards for game version ${result.version} (was ${result.previous ?? "empty"})`
        : `Cache is already on the latest game version, ${result.version}`,
);
