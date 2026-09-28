import path from "node:path";
import { SlashCommandBuilder } from "discord.js";
import { replyEphemeral } from "./replies.ts";
import type { SlashCommand } from "./types.ts";

const SOUNDS_DIR = path.join(import.meta.dir, "../../assets/sounds");
export const SOUNDS = ["doe", "sarenka"] as const;
type Sound = (typeof SOUNDS)[number];

const isSound = (name: string): name is Sound => (SOUNDS as readonly string[]).includes(name);

export const sound: SlashCommand = {
    data: new SlashCommandBuilder()
        .setName("sound")
        .setDescription("Play a classic")
        .addStringOption(opt =>
            opt
                .setName("name")
                .setDescription("Which one")
                .setRequired(true)
                .addChoices(...SOUNDS.map(name => ({ name, value: name }))),
        ),

    async execute(interaction) {
        const name = interaction.options.getString("name", true);
        if (!isSound(name)) {
            // Discord enforces the choices, but always answer so the user never sees "did not respond".
            await replyEphemeral(interaction, `Unknown sound \`${name}\`.`);
            return;
        }
        await interaction.reply({
            files: [{ attachment: path.join(SOUNDS_DIR, `${name}.mp3`), name: `${name}.mp3` }],
        });
    },
};
