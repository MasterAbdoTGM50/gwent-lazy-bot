import { SlashCommandBuilder } from "discord.js";
import { buildDeckEmbed } from "../decks/embed.ts";
import { normalizeDeckUrl } from "../decks/playgwent.ts";
import { PLAYGWENT_ORIGIN } from "../urls.ts";
import { replyEphemeral } from "./replies.ts";
import type { SlashCommand } from "./types.ts";

export const deck: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("deck")
        .setDescription("Summarize a deck from playgwent.com, or the last one shown in this channel")
        .addStringOption(opt =>
            opt
                .setName("link")
                .setDescription(
                    "A playgwent.com deck or guide link. Leave empty for the last deck shown in this channel",
                ),
        ),

    async execute(interaction, { settings, fetchDeck }) {
        const channelId = interaction.channelId;
        const locale = settings.getLang(channelId);
        const link = interaction.options.getString("link");

        // Without a link, repeat the channel's last deck, like the old `!lazy last`. Only decks shown
        // through /deck are remembered: chat messages aren't read for links.
        const source = link ?? settings.getLastDeck(channelId);
        if (!source) {
            await replyEphemeral(
                interaction,
                "No deck has been shown in this channel yet. Use `/deck link:` with a playgwent.com deck link.",
            );
            return;
        }

        // Stored links are re-localized too, in case the channel's language changed since.
        const url = normalizeDeckUrl(source, locale);
        if (!url) {
            await replyEphemeral(
                interaction,
                `That doesn't look like a playgwent.com deck link, e.g. \`${PLAYGWENT_ORIGIN}/en/decks/guides/123456\`.`,
            );
            return;
        }

        await interaction.deferReply();
        const result = await fetchDeck(url);
        if (!result) {
            await interaction.editReply(
                `Couldn't read a deck from <${url}>. It may be private, deleted, or playgwent.com may have changed.`,
            );
            return;
        }
        if (link) {
            settings.setLastDeck(channelId, url);
        }
        await interaction.editReply({ embeds: [buildDeckEmbed(result, url)] });
    },
};
