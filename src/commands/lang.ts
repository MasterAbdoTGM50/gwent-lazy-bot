import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { isLocale, LOCALE_NAMES, LOCALES } from "../locales.ts";
import { replyEphemeral } from "./replies.ts";
import type { SlashCommand } from "./types.ts";

export const lang: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("lang")
        .setDescription("Card language for this channel")
        .addSubcommand(sub => sub.setName("show").setDescription("Show the language cards are shown in here"))
        .addSubcommand(sub =>
            sub
                .setName("set")
                .setDescription("Set the language cards are shown in here (needs Manage Channels)")
                .addStringOption(opt =>
                    opt
                        .setName("language")
                        .setDescription("Card language")
                        .setRequired(true)
                        .addChoices(...LOCALES.map(code => ({ name: `${LOCALE_NAMES[code]} (${code})`, value: code }))),
                ),
        ),

    async execute(interaction, { settings, ownerIds }) {
        if (interaction.options.getSubcommand() === "show") {
            const current = settings.getLang(interaction.channelId);
            await replyEphemeral(
                interaction,
                `Cards in this channel are shown in **${LOCALE_NAMES[current]}** (\`${current}\`).`,
            );
            return;
        }

        // Discord can only gate whole commands, not subcommands, so the permission is checked here.
        const allowed =
            !interaction.inGuild() ||
            interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ||
            ownerIds.includes(interaction.user.id);
        if (!allowed) {
            await replyEphemeral(interaction, "You need the **Manage Channels** permission to change this.");
            return;
        }

        const code = interaction.options.getString("language", true);
        if (!isLocale(code)) {
            await replyEphemeral(interaction, `Unknown language \`${code}\`.`);
            return;
        }
        settings.setLang(interaction.channelId, code);
        await interaction.reply(`Cards in this channel will now be shown in **${LOCALE_NAMES[code]}**.`);
    },
};
