import type { Message } from "discord.js";
import { MINUTE } from "../time.ts";

const EASHA_USER_ID = "288328490506387457";
const IGNORED_CHANNEL_IDS = ["639471194135068674"];
/** Pinging her within this long after her last message earns the scolding. */
const ACTIVE_WITHIN_MINUTES = 15;

let lastActiveAt = 0;

/**
 * Easter egg: scold people who ping Easha while she's active. Only uses the author and the
 * mention list, which Discord provides without the Message Content intent.
 */
export async function handleEasha(message: Message): Promise<void> {
    if (!message.inGuild()) {
        return;
    }

    if (message.author.id === EASHA_USER_ID) {
        lastActiveAt = message.createdTimestamp;
        return;
    }

    if (IGNORED_CHANNEL_IDS.includes(message.channelId) || !message.mentions.users.has(EASHA_USER_ID)) {
        return;
    }

    const minutesAgo = (message.createdTimestamp - lastActiveAt) / MINUTE;
    if (minutesAgo > ACTIVE_WITHIN_MINUTES) {
        return;
    }

    await message.channel.send({
        content: `<@${message.author.id}> don't ping our lady! she's been active ${Math.max(1, Math.round(minutesAgo))} minutes ago!!!`,
        allowedMentions: { users: [message.author.id] },
    });
}
