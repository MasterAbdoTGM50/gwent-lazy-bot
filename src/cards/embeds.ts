import { EmbedBuilder } from "discord.js";
import { factionColor } from "../colors.ts";
import { BLANK, EMBED_DESCRIPTION_LIMIT, EMBED_FIELD_VALUE_LIMIT, truncate } from "../discord/limits.ts";
import type { GwentLocale } from "../locales.ts";
import { gwentOne } from "../urls.ts";
import { translations } from "./translations.ts";
import type { Card } from "./types.ts";

const flavorOf = (card: Card, locale: GwentLocale) => card.flavor[locale].replace(/\\n/g, "\n").trim();

function thumbnail(card: Card): string {
    return card.type === "leader" ? gwentOne.abilityIcon(card.id) : gwentOne.cardArt(card.art);
}

export function buildCardEmbed(card: Card, locale: GwentLocale): EmbedBuilder {
    const t = translations[locale];
    const embed = new EmbedBuilder()
        .setColor(factionColor(card.faction))
        .setTitle(card.name[locale] + (card.category[locale] ? ` - ${card.category[locale]}` : ""))
        .setURL(gwentOne.cardPage(locale, card.id))
        .setThumbnail(thumbnail(card));

    let faction = t.factions[card.faction];
    if (card.secondaryFaction) {
        faction += ` & ${t.factions[card.secondaryFaction]}`;
    }

    if (card.type !== "leader") {
        let stats = `${t.provision}: ${card.provisions}`;
        if (card.power !== 0) {
            stats += `\n${t.power}: ${card.power}`;
        }
        if (card.armor !== 0) {
            stats += `\n${t.armor}: ${card.armor}`;
        }
        embed.addFields({ name: BLANK, value: stats });

        const flavor = flavorOf(card, locale);
        if (flavor) {
            // The two asterisks italicize the flavor text and count toward the limit.
            embed.addFields({ name: BLANK, value: `*${truncate(flavor, EMBED_FIELD_VALUE_LIMIT - 2)}*` });
        }

        faction += ` - ${t.rarities[card.rarity]} ${t.types[card.type]}`;
    }

    embed.setAuthor({ name: faction });
    const ability = card.ability[locale].trim();
    if (ability) {
        embed.setDescription(truncate(ability, EMBED_DESCRIPTION_LIMIT));
    }
    return embed;
}

/** The "reddit" nickname easter egg: just the name, art and flavor text. */
export function buildMemeCardEmbed(card: Card, locale: GwentLocale): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(factionColor(card.faction))
        .setTitle(card.name[locale])
        .setURL(gwentOne.cardPage(locale, card.id))
        .setThumbnail(thumbnail(card));
    const flavor = flavorOf(card, locale);
    if (flavor) {
        embed.setDescription(truncate(flavor, EMBED_DESCRIPTION_LIMIT));
    }
    return embed;
}
