const Discord = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");
const utils = require("../utils/utils");

module.exports = {
    handle(bot, message, locale) {
        const regex = /(https:\/\/www\.playgwent\.com\/[a-z][a-z]\/decks\/((guides\/[0-9]*)|([a-z0-9]*)))/g;
        let matches = utils.findMatches(message.content, regex);
        if(matches.length !== 0) {
            bot.db.channels.update({ _id: message.channel.id }, { $set: { deck: matches.pop() } }, { upsert: true });
        }
    }
}