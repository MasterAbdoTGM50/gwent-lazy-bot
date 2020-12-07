const Discord = require("discord.js");
const utils = require("../utils/utils.js");
const path = require('path');

let commands = utils.lazyImport(path.join(__dirname, "commands"));

module.exports = {
    async handle(bot, message, locale) {
        if(!message.content.startsWith(bot.lib.prefix)) return false;

        let args = message.content.slice(bot.lib.prefix.length).trim().split(/\s+/g);
        let com = args.shift().toLowerCase()

        for(let command of commands) {
            if(command.name === com) { command.handle(bot, message, locale, args); break; }
        }

    }
}