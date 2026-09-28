import { describe, expect, test } from "bun:test";
import type { ChatInputCommandInteraction } from "discord.js";
import { SOUNDS, sound } from "../src/commands/sound.ts";
import type { BotContext } from "../src/context.ts";

describe("/sound", () => {
    for (const name of SOUNDS) {
        test(`${name} attaches an existing file`, async () => {
            let payload: any;
            const interaction = {
                options: { getString: () => name },
                reply: async (p: any) => {
                    payload = p;
                },
            } as unknown as ChatInputCommandInteraction;

            await sound.execute(interaction, {} as BotContext);
            const [file] = payload.files;
            expect(file.name).toBe(`${name}.mp3`);
            expect(await Bun.file(file.attachment).exists()).toBe(true);
        });
    }
});
