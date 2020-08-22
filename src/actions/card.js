const Discord = require("discord.js");

function buildCardEmbed(bot, card, locale) {
    let embed = new Discord.MessageEmbed();
    let title = card.name[locale] + " - " + card.categories[locale];
    let url = "https://gwent.one/en/card/" + card.id;
    let thumb = "https://gwent.one/img/assets/medium/art/" + card.art + ".jpg";
    let faction = bot.translations[locale]["factions"][card.factions[0]];
    let color = bot.lib.colors[card.factions[0]];
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
    embed.setAuthor(faction + " - " + rarity + " - " + type)
    embed.setDescription(ability);
    embed.addField("\u200b", stats);
    embed.addField("\u200b","*" +  flavor + "*");
    return embed;
}

module.exports = {
    handle(bot, message, locale) {
        const regex = /\[(.*?)]/g;

        let matches = [], match;
        while((match = regex.exec(message.content)) !== null) {
            if(match[1].trim() !== "")  { matches.push(match[1].trim()); }
        }

        for(let match of matches) {
            let result = bot.lisas[locale].search(match);
            if(result.length === 1) {
                message.channel.send(buildCardEmbed(bot, bot.cards[result[0]], locale));
            }
        }
    }
}