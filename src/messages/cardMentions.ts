import type { EmbedBuilder, Message } from "discord.js";
import { buildCardEmbed, buildMemeCardEmbed } from "../cards/embeds.ts";
import type { CardStore } from "../cards/store.ts";
import type { Card } from "../cards/types.ts";
import type { BotContext } from "../context.ts";
import nicknameList from "../data/nicknames.json";
import { EMBED_CHARS_PER_MESSAGE, EMBEDS_PER_MESSAGE } from "../discord/limits.ts";
import type { GwentLocale } from "../locales.ts";

/** Caps how many cards one message can trigger (a bot policy, separate from Discord's limits). */
export const MAX_CARDS_PER_MESSAGE = 10;

export interface Nickname {
    id: number;
    /** Show the card with the meme embed (just name, art and flavor). */
    meme: boolean;
}

export const nicknames = new Map<string, Nickname>(
    (nicknameList as { id: number; name: string; meme?: boolean }[]).map(n => [
        n.name.toLowerCase(),
        { id: n.id, meme: n.meme ?? false },
    ]),
);

export interface CardMatch {
    card: Card;
    meme: boolean;
}

/** Everything written inside [square brackets], trimmed, without empty ones. */
export function extractQueries(content: string): string[] {
    return [...content.matchAll(/\[(.*?)]/g)].map(m => (m[1] ?? "").trim()).filter(q => q !== "");
}

export function resolveQueries(
    store: CardStore,
    queries: string[],
    locale: GwentLocale,
    nicks: Map<string, Nickname> = nicknames,
): CardMatch[] {
    const matches: CardMatch[] = [];
    const seen = new Set<number>();
    const add = (card: Card | undefined, meme = false) => {
        if (!card || seen.has(card.id) || matches.length >= MAX_CARDS_PER_MESSAGE) {
            return;
        }
        seen.add(card.id);
        matches.push({ card, meme });
    };

    for (const query of queries) {
        const nickname = nicks.get(query.toLowerCase());
        if (nickname) {
            add(store.byId(nickname.id), nickname.meme);
            continue;
        }

        // Search the channel's language first, then fall back to English names.
        const langs: GwentLocale[] = locale === "en" ? ["en"] : [locale, "en"];
        for (const lang of langs) {
            const found = store.search(lang, query);
            if (found.length === 1) {
                add(found[0]);
                break;
            }
        }
    }
    return matches;
}

/** Nicknames pointing at card IDs gwent.one no longer serves. */
export function staleNicknames(store: CardStore, nicks: Map<string, Nickname> = nicknames): string[] {
    return [...nicks].filter(([, { id }]) => !store.byId(id)).map(([name, { id }]) => `${name} (${id})`);
}

export function buildEmbeds(matches: CardMatch[], locale: GwentLocale): EmbedBuilder[] {
    return matches.map(({ card, meme }) => (meme ? buildMemeCardEmbed(card, locale) : buildCardEmbed(card, locale)));
}

/** Packs embeds, in order, into as few messages as Discord's per-message limits allow. */
export function chunkEmbeds(embeds: EmbedBuilder[]): EmbedBuilder[][] {
    const chunks: EmbedBuilder[][] = [];
    let current: EmbedBuilder[] = [];
    let chars = 0;
    for (const embed of embeds) {
        if (
            current.length > 0 &&
            (current.length >= EMBEDS_PER_MESSAGE || chars + embed.length > EMBED_CHARS_PER_MESSAGE)
        ) {
            chunks.push(current);
            current = [];
            chars = 0;
        }
        current.push(embed);
        chars += embed.length;
    }
    if (current.length > 0) {
        chunks.push(current);
    }
    return chunks;
}

export async function handleCardMentions(message: Message, { cards: store, settings }: BotContext): Promise<void> {
    if (!store.ready || !message.content.includes("[")) {
        return;
    }

    const queries = extractQueries(message.content);
    if (queries.length === 0) {
        return;
    }

    const locale = settings.getLang(message.channelId);
    const matches = resolveQueries(store, queries, locale);
    if (matches.length === 0 || !message.channel.isSendable()) {
        return;
    }

    for (const embeds of chunkEmbeds(buildEmbeds(matches, locale))) {
        await message.channel.send({ embeds });
    }
}
