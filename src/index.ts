import { createClient, registerHandlers } from "./bot.ts";
import { createGwentApi } from "./cards/api.ts";
import { scheduleCardUpdates } from "./cards/scheduler.ts";
import { CardStore } from "./cards/store.ts";
import { loadConfig } from "./config.ts";
import type { BotContext } from "./context.ts";
import { fetchDeck } from "./decks/playgwent.ts";
import { log } from "./log.ts";
import { staleNicknames } from "./messages/cardMentions.ts";
import { ChannelSettings } from "./settings/channelSettings.ts";
import { DAY, HOUR } from "./time.ts";

process.on("unhandledRejection", err => log.error("Unhandled rejection:", err));

const config = loadConfig();
const settings = new ChannelSettings(config.paths.database);
const cards = new CardStore(createGwentApi(config.gwentApiKey), config.paths.cardCache);
const ctx: BotContext = { cards, settings, ownerIds: config.ownerIds, fetchDeck };

const client = createClient();
registerHandlers(client, ctx);

function checkNicknames() {
    const stale = staleNicknames(cards);
    if (stale.length > 0) {
        log.warn(`nicknames.json points at unknown cards: ${stale.join(", ")}`);
    }
}

if (await cards.loadCache()) {
    checkNicknames();
}
const stopUpdates = scheduleCardUpdates(cards, { intervalMs: DAY, retryMs: HOUR, onUpdated: checkNicknames });

async function shutdown(signal: string) {
    log.info(`Received ${signal}, shutting down`);
    stopUpdates();
    await client.destroy();
    settings.close();
    process.exit(0);
}
process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

await client.login(config.token);
