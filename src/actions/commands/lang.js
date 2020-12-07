const Discord = require("discord.js");

module.exports = {
    name: "lang",
    handle: async(bot, message, locale, args) => {
        if(args.length === 0) {
            let lang = await bot.getChannelLang(message.channel);
            if(lang !== null) { message.channel.send(lang); }
        }

        if(args.length === 2) {
            if(message.member.hasPermission("MANAGE_CHANNELS")) {
                bot.setChannelLang(message.channel, args[1]);
            }
        }
    }
}