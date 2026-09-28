import type { Message } from "discord.js";
import type { BotContext } from "../context.ts";
import { handleCardMentions } from "./cardMentions.ts";
import { handleEasha } from "./easha.ts";

export type MessageHandler = (message: Message, ctx: BotContext) => Promise<void>;

/** Run for every message from a non-bot user. */
export const messageHandlers: MessageHandler[] = [handleCardMentions, handleEasha];
