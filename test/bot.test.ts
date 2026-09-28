import { describe, expect, test } from "bun:test";
import type { Interaction, Message } from "discord.js";
import { COMMAND_FAILED_MESSAGE, handleInteraction, handleMessage } from "../src/bot.ts";
import type { SlashCommand } from "../src/commands/types.ts";
import type { BotContext } from "../src/context.ts";

const ctx = {} as BotContext;

function commandsThat(execute: SlashCommand["execute"]): Map<string, SlashCommand> {
    return new Map([["test", { data: { name: "test", toJSON: () => ({ name: "test", description: "" }) }, execute }]]);
}

/** A slash-command interaction that records which reply method was used. */
function fakeInteraction(state: { deferred?: boolean; replied?: boolean; commandName?: string } = {}) {
    const calls: { method: string; payload: any }[] = [];
    const record = (method: string) => async (payload: any) => {
        calls.push({ method, payload });
    };
    const interaction = {
        isChatInputCommand: () => true,
        commandName: state.commandName ?? "test",
        deferred: state.deferred ?? false,
        replied: state.replied ?? false,
        reply: record("reply"),
        editReply: record("editReply"),
        followUp: record("followUp"),
    } as unknown as Interaction;
    return { interaction, calls };
}

const failing = commandsThat(async () => {
    throw new Error("boom");
});

describe("handleInteraction", () => {
    test("runs the matching command", async () => {
        let ran = false;
        const { interaction, calls } = fakeInteraction();
        await handleInteraction(
            interaction,
            ctx,
            commandsThat(async () => {
                ran = true;
            }),
        );
        expect(ran).toBe(true);
        expect(calls).toEqual([]);
    });

    test("ignores unknown commands", async () => {
        const { interaction, calls } = fakeInteraction({ commandName: "nope" });
        await handleInteraction(interaction, ctx, failing);
        expect(calls).toEqual([]);
    });

    test("a failure before replying gets a private error reply", async () => {
        const { interaction, calls } = fakeInteraction();
        await handleInteraction(interaction, ctx, failing);
        expect(calls).toEqual([
            { method: "reply", payload: expect.objectContaining({ content: COMMAND_FAILED_MESSAGE }) },
        ]);
    });

    test("a failure after deferring replaces the thinking placeholder", async () => {
        const { interaction, calls } = fakeInteraction({ deferred: true });
        await handleInteraction(interaction, ctx, failing);
        expect(calls).toEqual([{ method: "editReply", payload: { content: COMMAND_FAILED_MESSAGE, embeds: [] } }]);
    });

    test("a failure after replying adds a private follow-up", async () => {
        const { interaction, calls } = fakeInteraction({ deferred: true, replied: true });
        await handleInteraction(interaction, ctx, failing);
        expect(calls.map(c => c.method)).toEqual(["followUp"]);
    });
});

describe("handleMessage", () => {
    const message = (bot: boolean) => ({ author: { bot }, channelId: "chan" }) as unknown as Message;

    test("one failing handler doesn't stop the others", async () => {
        let ran = false;
        await handleMessage(message(false), ctx, [
            async () => {
                throw new Error("boom");
            },
            async () => {
                ran = true;
            },
        ]);
        expect(ran).toBe(true);
    });

    test("ignores bots", async () => {
        let ran = false;
        await handleMessage(message(true), ctx, [
            async () => {
                ran = true;
            },
        ]);
        expect(ran).toBe(false);
    });
});
