import translationsJson from "../data/translations.json";
import type { GwentLocale } from "../locales.ts";
import type { CardType, Faction, Rarity } from "./types.ts";

/** The labels card embeds use, per language. translations.json has more keys; only these are read. */
export interface Translation {
    provision: string;
    power: string;
    armor: string;
    factions: Record<Faction, string>;
    rarities: Record<Rarity, string>;
    types: Record<CardType, string>;
}

// JSON imports aren't checked against Translation; test/translations.test.ts verifies every key exists.
export const translations = translationsJson as Record<GwentLocale, Translation>;
