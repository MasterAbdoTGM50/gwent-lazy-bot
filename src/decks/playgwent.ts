import type { GwentLocale } from "../locales.ts";
import { log } from "../log.ts";
import { SECOND } from "../time.ts";
import { PLAYGWENT_ORIGIN } from "../urls.ts";

export interface DeckCard {
    localizedName: string;
    provisionsCost: number;
    cardGroup: string;
    repeatCount: number;
}

export interface Deck {
    leader: {
        localizedName: string;
        faction: { slug: string };
        abilityImg?: { small?: string } | null;
    };
    stratagem?: { localizedName: string } | null;
    cards: DeckCard[];
    provisionsCost?: number;
    craftingCost?: number;
}

const DECK_PAGE_TIMEOUT_MS = 15 * SECOND;

// playgwent.com's language codes differ from the bot's for some locales. It has no Latin American
// Spanish, so "mx" falls back to Spanish. An unknown code redirects to a broken URL.
const SITE_LOCALES: Record<GwentLocale, string> = {
    en: "en",
    cn: "zh-cn",
    de: "de",
    es: "es",
    fr: "fr",
    it: "it",
    jp: "ja",
    kr: "ko",
    mx: "es",
    pl: "pl",
    pt: "pt-BR",
    ru: "ru",
};

const DECK_PATH = /^\/[a-z]{2}(?:-[a-z]{2})?\/decks\/(guides\/\d+|[a-z0-9]+)\/?$/i;

/**
 * Validates a playgwent.com deck link and rewrites it to the requested language.
 * Returns null for anything that isn't a deck or guide link.
 */
export function normalizeDeckUrl(input: string, locale: GwentLocale): string | null {
    let url: URL;
    try {
        url = new URL(input.trim());
    } catch {
        return null;
    }
    if (!["playgwent.com", "www.playgwent.com"].includes(url.hostname)) {
        return null;
    }

    const deckPath = DECK_PATH.exec(url.pathname)?.[1];
    if (!deckPath || deckPath.toLowerCase() === "builder") {
        return null;
    }
    return `${PLAYGWENT_ORIGIN}/${SITE_LOCALES[locale]}/decks/${deckPath}`;
}

const NAMED_ENTITIES: Record<string, string> = { quot: '"', amp: "&", lt: "<", gt: ">", apos: "'" };

function decodeEntities(value: string): string {
    return value.replace(/&(#x[0-9a-f]+|#\d+|quot|amp|lt|gt|apos);/gi, (original, entity: string) => {
        const lower = entity.toLowerCase();
        if (lower.startsWith("#x")) {
            return String.fromCodePoint(parseInt(lower.slice(2), 16));
        }
        if (lower.startsWith("#")) {
            return String.fromCodePoint(parseInt(lower.slice(1), 10));
        }
        return NAMED_ENTITIES[lower] ?? original;
    });
}

/** Extracts the deck from a playgwent.com deck or guide page (the page embeds its state as JSON). */
export function parseDeckPage(html: string): Deck | null {
    let raw: string | null = null;
    new HTMLRewriter()
        .on("#root", {
            element(el) {
                raw = el.getAttribute("data-state");
            },
        })
        .transform(html);
    if (raw === null) {
        return null;
    }

    let state: { deck?: Deck; guide?: { deck?: Deck } };
    try {
        state = JSON.parse(decodeEntities(raw));
    } catch {
        return null;
    }

    const deck = state.deck ?? state.guide?.deck;
    if (!deck?.leader?.localizedName || !Array.isArray(deck.cards)) {
        return null;
    }
    return deck;
}

/** Fetches and parses a deck page. Returns null when the page can't be fetched or holds no deck. */
export async function fetchDeck(url: string): Promise<Deck | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(DECK_PAGE_TIMEOUT_MS) });
        if (!res.ok) {
            return null;
        }
        return parseDeckPage(await res.text());
    } catch (err) {
        // Timeouts and network errors are reported to the user the same way as a missing deck.
        log.warn(`Fetching deck ${url} failed:`, err);
        return null;
    }
}
