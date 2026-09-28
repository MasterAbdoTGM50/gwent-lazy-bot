/**
 * Registers the bot's slash commands with Discord. Run it after changing command definitions.
 *
 *   bun run register-commands --guild <id>      every command to one guild only (instant; for a test server)
 *   bun run register-commands --yes             every command globally, in every server the bot is in
 *   bun run register-commands --clear --yes     remove all global commands
 *   bun run register-commands --guild <id> --clear
 *
 * It always prints which application the token belongs to first. Global changes need --yes, so a
 * production token in the wrong .env can't change every server by accident.
 */
import { parseArgs } from "node:util";
import { type APIApplication, type APIPartialGuild, REST, Routes } from "discord.js";
import { commands } from "../src/commands/index.ts";
import { loadConfig } from "../src/config.ts";

const { values: args } = parseArgs({
    options: {
        guild: { type: "string" },
        clear: { type: "boolean", default: false },
        yes: { type: "boolean", default: false },
    },
});

const config = loadConfig();
const rest = new REST().setToken(config.token);
const app = (await rest.get(Routes.currentApplication())) as APIApplication;
const guilds = (await rest.get(Routes.userGuilds())) as APIPartialGuild[];
const serverCount = guilds.length === 200 ? "200+" : String(guilds.length);
console.log(`Application: ${app.name} (bot in ${serverCount} servers)`);

if (!args.guild && !args.yes) {
    console.error(
        `This would ${args.clear ? "remove the commands from" : "change the commands in"} all ${serverCount} servers.` +
            " Re-run with --yes if that's intended, or use --guild <id> for one server.",
    );
    process.exit(1);
}

const list = args.clear ? [] : commands;
const route = args.guild ? Routes.applicationGuildCommands(app.id, args.guild) : Routes.applicationCommands(app.id);
await rest.put(route, { body: list.map(c => c.data.toJSON()) });

const where = args.guild ? `to guild ${args.guild}` : "globally";
const names = list.map(c => `/${c.data.name}`).join(" ");
const removedFrom = args.guild ? `from guild ${args.guild}` : "globally";
console.log(
    args.clear ? `Removed all commands ${removedFrom}` : `Registered ${list.length} command(s) ${where}: ${names}`,
);
