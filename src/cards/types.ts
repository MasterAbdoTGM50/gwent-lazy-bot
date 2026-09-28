import type { Localized } from "../locales.ts";

/** Faction names as gwent.one spells them, lowercased (also the keys in translations.json). */
export const FACTIONS = [
    "neutral",
    "monster",
    "nilfgaard",
    "northern realms",
    "scoiatael",
    "skellige",
    "syndicate",
] as const;
export type Faction = (typeof FACTIONS)[number];

/** gwent.one calls leaders "ability" cards; the bot calls them leaders. */
export const CARD_TYPES = ["unit", "special", "artifact", "stratagem", "leader"] as const;
export type CardType = (typeof CARD_TYPES)[number];

export const RARITIES = ["common", "rare", "epic", "legendary"] as const;
export type Rarity = (typeof RARITIES)[number];

export const CARD_COLORS = ["bronze", "gold", "leader"] as const;
export type CardColor = (typeof CARD_COLORS)[number];

export interface Card {
    id: number;
    art: number;
    name: Localized;
    category: Localized;
    ability: Localized;
    flavor: Localized;
    faction: Faction;
    /** Set only for dual-faction cards. */
    secondaryFaction: Faction | null;
    color: CardColor;
    rarity: Rarity;
    type: CardType;
    provisions: number;
    power: number;
    armor: number;
}

/**
 * Bump whenever the shape of `Card` changes, so caches written by older code are
 * re-downloaded instead of loaded with missing or renamed fields.
 */
export const CARD_CACHE_FORMAT = 2;

export interface CardCache {
    format: number;
    /** The game version the cards belong to. */
    version: string;
    fetchedAt: string;
    cards: Card[];
}
