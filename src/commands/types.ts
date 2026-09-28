import type { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import type { BotContext } from "../context.ts";

export interface SlashCommand {
    data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
    execute(interaction: ChatInputCommandInteraction, ctx: BotContext): Promise<void>;
}
