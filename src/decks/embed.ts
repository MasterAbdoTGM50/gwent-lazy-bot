import { EmbedBuilder } from "discord.js";
import { factionColor } from "../colors.ts";
import { BLANK, EMBED_FIELD_VALUE_LIMIT, truncate } from "../discord/limits.ts";
import { PLAYGWENT_ORIGIN } from "../urls.ts";
import type { Deck, DeckCard } from "./playgwent.ts";

function list(cards: DeckCard[], withCounts: boolean): string {
    const lines = cards.map(c => (withCounts ? `${c.repeatCount + 1}x ${c.localizedName}` : c.localizedName));
    return truncate(lines.join("\n"), EMBED_FIELD_VALUE_LIMIT) || BLANK;
}

export function buildDeckEmbed(deck: Deck, url: string): EmbedBuilder {
    const cards = [...deck.cards].sort((a, b) => b.provisionsCost - a.provisionsCost);
    // Golds are unique; bronzes only get "2x" counts when the deck actually has duplicates.
    const bronzeCounts = cards.some(c => c.repeatCount > 0);

    const embed = new EmbedBuilder()
        .setTitle(deck.leader.localizedName)
        .setURL(url)
        .setColor(factionColor(deck.leader.faction.slug));

    const icon = deck.leader.abilityImg?.small;
    if (icon) {
        embed.setThumbnail(PLAYGWENT_ORIGIN + icon);
    }
    if (deck.stratagem?.localizedName) {
        embed.addFields({ name: "Stratagem", value: deck.stratagem.localizedName });
    }

    embed.addFields(
        {
            name: "Golds",
            value: list(
                cards.filter(c => c.cardGroup === "gold"),
                false,
            ),
            inline: true,
        },
        {
            name: "Bronzes",
            value: list(
                cards.filter(c => c.cardGroup === "bronze"),
                bronzeCounts,
            ),
            inline: true,
        },
    );

    const footer = [
        deck.provisionsCost !== undefined && `${deck.provisionsCost} provisions`,
        deck.craftingCost !== undefined && `${deck.craftingCost} scraps`,
    ]
        .filter(Boolean)
        .join(" · ");
    if (footer) {
        embed.setFooter({ text: footer });
    }
    return embed;
}
