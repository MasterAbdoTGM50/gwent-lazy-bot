import { type ChatInputCommandInteraction, MessageFlags } from "discord.js";

/** Replies with a message only the user who ran the command can see. */
export async function replyEphemeral(interaction: ChatInputCommandInteraction, content: string): Promise<void> {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
}
