import {
    Client,
    Events,
    GatewayIntentBits,
    type Interaction,
    type Message,
    MessageFlags,
    Options,
    Partials,
} from "discord.js";
import { commandsByName } from "./commands/index.ts";
import { replyEphemeral } from "./commands/replies.ts";
import type { SlashCommand } from "./commands/types.ts";
import type { BotContext } from "./context.ts";
import { log } from "./log.ts";
import { type MessageHandler, messageHandlers } from "./messages/index.ts";

export const COMMAND_FAILED_MESSAGE = "Something went wrong running that command.";

export function createClient(): Client {
    return new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            // Privileged: only needed for the [card name] syntax.
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessages,
        ],
        partials: [Partials.Channel], // required to receive DMs
        allowedMentions: { parse: [] },
        makeCache: Options.cacheWithLimits({
            ...Options.DefaultMakeCacheSettings,
            MessageManager: 0,
            ReactionManager: 0,
        }),
    });
}

/** Runs every message handler; one failing doesn't stop the others. */
export async function handleMessage(
    message: Message,
    ctx: BotContext,
    handlers: MessageHandler[] = messageHandlers,
): Promise<void> {
    if (message.author.bot) {
        return;
    }
    const results = await Promise.allSettled(handlers.map(handler => handler(message, ctx)));
    for (const result of results) {
        if (result.status === "rejected") {
            log.error(`Message handler failed in channel ${message.channelId}:`, result.reason);
        }
    }
}

/** Runs the matching slash command, telling the user if it fails. */
export async function handleInteraction(
    interaction: Interaction,
    ctx: BotContext,
    commands: Map<string, SlashCommand> = commandsByName,
): Promise<void> {
    if (!interaction.isChatInputCommand()) {
        return;
    }
    const command = commands.get(interaction.commandName);
    if (!command) {
        return;
    }

    try {
        await command.execute(interaction, ctx);
    } catch (err) {
        log.error(`/${interaction.commandName} failed:`, err);
        let response: Promise<unknown>;
        if (interaction.deferred && !interaction.replied) {
            // Replace the "thinking…" placeholder; its visibility was fixed when it was deferred.
            response = interaction.editReply({ content: COMMAND_FAILED_MESSAGE, embeds: [] });
        } else if (interaction.replied) {
            response = interaction.followUp({ content: COMMAND_FAILED_MESSAGE, flags: MessageFlags.Ephemeral });
        } else {
            response = replyEphemeral(interaction, COMMAND_FAILED_MESSAGE);
        }
        await response.catch(() => {
            /* the interaction may have expired */
        });
    }
}

export function registerHandlers(client: Client, ctx: BotContext): void {
    client.on(Events.MessageCreate, message => handleMessage(message, ctx));
    client.on(Events.InteractionCreate, interaction => handleInteraction(interaction, ctx));
    client.on(Events.Error, err => log.error("Discord client error:", err));
    client.once(Events.ClientReady, c => {
        log.info(`GWENT Lazy Bot! Ready as ${c.user.tag} in ${c.guilds.cache.size} servers`);
    });
}
