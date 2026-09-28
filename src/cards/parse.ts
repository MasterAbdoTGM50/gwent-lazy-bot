import { type GwentLocale, LOCALES, type Localized } from "../locales.ts";
import { log } from "../log.ts";
import type { RawCard } from "./api.ts";
import { CARD_COLORS, CARD_TYPES, type Card, FACTIONS, RARITIES } from "./types.ts";

type TextField = "name" | "category" | "ability" | "flavor";

const reportedUnknowns = new Set<string>();

/**
 * Lowercases a gwent.one value and checks it's one the bot knows. An unknown value (say, a new
 * faction) falls back instead of failing the whole update, and is logged once per process.
 */
function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T, what: string): T {
    const lower = value.toLowerCase();
    if ((allowed as readonly string[]).includes(lower)) {
        return lower as T;
    }
    if (!reportedUnknowns.has(`${what}:${lower}`)) {
        reportedUnknowns.add(`${what}:${lower}`);
        log.warn(`Unknown ${what} "${value}" from gwent.one; treating it as "${fallback}"`);
    }
    return fallback;
}

/** Merges one card list per language into multi-language cards, keyed off the English list. */
export function mergeCardLists(lists: Map<GwentLocale, RawCard[]>): Card[] {
    const en = lists.get("en");
    if (!en) {
        throw new Error("The English card list is required");
    }

    const byLocale = new Map<GwentLocale, Map<number, RawCard>>();
    for (const [locale, cards] of lists) {
        byLocale.set(locale, new Map(cards.map(card => [card.id.card, card])));
    }

    return en.map(raw => {
        // A card missing from a translation falls back to its English text.
        const localized = (field: TextField): Localized =>
            Object.fromEntries(
                LOCALES.map(locale => [locale, byLocale.get(locale)?.get(raw.id.card)?.[field] ?? raw[field] ?? ""]),
            ) as Localized;

        const attrs = raw.attributes;
        const type = attrs.type.toLowerCase() === "ability" ? "leader" : attrs.type;
        return {
            id: raw.id.card,
            art: raw.id.art,
            name: localized("name"),
            category: localized("category"),
            ability: localized("ability"),
            flavor: localized("flavor"),
            faction: oneOf(attrs.faction, FACTIONS, "neutral", "faction"),
            secondaryFaction: attrs.factionSecondary
                ? oneOf(attrs.factionSecondary, FACTIONS, "neutral", "faction")
                : null,
            color: oneOf(attrs.color, CARD_COLORS, "bronze", "color"),
            rarity: oneOf(attrs.rarity, RARITIES, "common", "rarity"),
            type: oneOf(type, CARD_TYPES, "special", "card type"),
            provisions: attrs.provision,
            power: attrs.power,
            armor: attrs.armor,
        };
    });
}
