const Discord = require("discord.js");
const utils = require("../utils/utils.js");

function buildCardEmbed(bot, card, locale) {
    let embed = new Discord.MessageEmbed();
    let title = card.name[locale];
    if(card.categories[locale] !== "") { title += " - " + card.categories[locale]; }
    let url = "https://gwent.one/" + locale + "/card/" + card.id;
    let thumb = "https://gwent.one/image/gwent/assets/card/art/medium/" + card.art + ".jpg";
    if(card.type === "leader") { thumb = "https://gwent.one/img/icon/ability/" + card.id + ".png" }
    let color = bot.lib.colors[card.factions[0]];
    let faction = bot.translations[locale]["factions"][card.factions[0]];
    if(card.factions[1] !== "") { faction += " & " + bot.translations[locale]["factions"][card.factions[1]] }
    let rarity = bot.translations[locale]["rarities"][card.rarity];
    let type = bot.translations[locale]["types"][card.type];
    let ability = card.ability[locale];
    let stats = bot.translations[locale]["provision"] + ": " + card.provisions;
    if(card.power !== 0) { stats += "\n" + bot.translations[locale]["power"] + ": " + card.power; }
    if(card.armor !== 0) { stats += "\n" + bot.translations[locale]["armor"] + ": " + card.armor; }
    let flavor = card.flavor[locale].replace(/\\n/g, "\n");

    embed.setColor(color);
    embed.setTitle(title);
    embed.setURL(url);
    embed.setThumbnail(thumb);
    if(card.type !== "leader") {
        embed.addField("\u200b", stats);
        embed.addField("\u200b","*" +  flavor + "*");
        faction += " - " + rarity + " " + type;
    }
    embed.setAuthor(faction)
    embed.setDescription(ability);
    return embed;
}

function buildMemeCardEmbed(bot, card, locale) {
    let embed = new Discord.MessageEmbed();
    let title = card.name[locale];
    let url = "https://gwent.one/" + locale + "/card/" + card.id;
    let thumb = "https://gwent.one/img/assets/medium/art/" + card.art + ".jpg";
    if(card.type === "leader") { thumb = "https://gwent.one/img/icon/ability/" + card.id + ".png" }
    let color = bot.lib.colors[card.factions[0]];
    let flavor = card.flavor[locale].replace(/\\n/g, "\n");

    embed.setColor(color);
    embed.setTitle(title);
    embed.setURL(url);
    embed.setThumbnail(thumb);
    embed.setDescription(flavor);
    return embed;
}

module.exports = {
    async handle(bot, message, locale) {
        let matches = utils.findMatches(message.content, /\[(.*?)]/g);

        for(let match of matches) {

            let result = bot.nicknames.filter(nick => { return nick.name === match.toLowerCase() });
            if(result.length === 1) {
                if(match.toLowerCase() === "reddit") { message.channel.send(buildMemeCardEmbed(bot, bot.lisas[locale].findByKey(result[0].id), locale)); }
                else {
                    message.channel.send(buildCardEmbed(bot, bot.lisas[locale].findByKey(result[0].id), locale));
                }
                return;
            }

            let langs = (locale === "en") ? ["en"] : [locale, "en"];
            for(let lang of langs) {
                let result = bot.lisas[lang].findByAlias(match);
                if(result.length === 1) {
                    message.channel.send(buildCardEmbed(bot, result[0], locale));
                    break;
                }
            }
        }
    }
}
