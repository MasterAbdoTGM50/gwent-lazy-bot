import type { CardStore } from "./cards/store.ts";
import type { Deck } from "./decks/playgwent.ts";
import type { ChannelSettings } from "./settings/channelSettings.ts";

/** What every command and message handler gets to work with. */
export interface BotContext {
    cards: CardStore;
    settings: ChannelSettings;
    /** Discord user IDs allowed to change any channel's language. */
    ownerIds: string[];
    /** Fetches and parses a playgwent.com deck page (replaceable in tests). */
    fetchDeck(url: string): Promise<Deck | null>;
}
