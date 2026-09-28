import { about } from "./about.ts";
import { deck } from "./deck.ts";
import { lang } from "./lang.ts";
import { sound } from "./sound.ts";
import type { SlashCommand } from "./types.ts";

export const commands: SlashCommand[] = [lang, deck, sound, about];

export const commandsByName = new Map(commands.map(command => [command.data.name, command]));
