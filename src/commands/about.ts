import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { NEUTRAL_COLOR } from "../colors.ts";
import { GWENT_ONE_ORIGIN, REPO_URL } from "../urls.ts";
import type { SlashCommand } from "./types.ts";

const SUMMARY = "Write a card's name in square brackets, like `[ciri]`, anywhere in a message to see the card.";

const CREDITS = [
    ["MasterAbdoTGM50", "Author"],
    ["teddybee_r", `Owner and creator of [gwent.one](${GWENT_ONE_ORIGIN}), where all card data comes from`],
    ["Pinkie the Smart Elf", "Creator of the bot's profile picture"],
    ["Jemoni", "Maintaining the bot in the author's absence and helping create the profile picture"],
    ["Mortin", "Maintaining the bot in the author's absence and creating/maintaining documentation"],
] as const;

export const about: SlashCommand = {
    data: new SlashCommandBuilder().setName("about").setDescription("What this bot is, and who made and maintains it"),

    async execute(interaction, { cards }) {
        const embed = new EmbedBuilder()
            .setTitle("GWENT Lazy Bot")
            .setURL(REPO_URL)
            .setColor(NEUTRAL_COLOR)
            .setDescription(SUMMARY)
            .addFields({ name: "Credits", value: CREDITS.map(([who, what]) => `**${who}**: ${what}`).join("\n") });
        if (cards.version) {
            embed.setFooter({ text: `Card data: game version ${cards.version}` });
        }
        await interaction.reply({ embeds: [embed] });
    },
};
