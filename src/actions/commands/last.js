const Discord = require("discord.js");
const axios = require("axios");
const cheerio = require("cheerio");

function forceLinkLocale(link, locale) {
    let i = link.indexOf(".com/") + 5;
    return link.substr(0, i) + locale + link.substr(i + 2);
}

function buildDeckEmbed(bot, deck, locale) {
    const embed = new Discord.MessageEmbed();
    embed.setTitle(deck.leader.localizedName);
    embed.setThumbnail("https://www.playgwent.com" + deck.leader.abilityImg.small);
    let color = bot.lib.colors[deck.leader.faction.slug.toLowerCase()];
    embed.setColor(color);

    embed.addField("Strategem", deck.stratagem.localizedName);

    deck.cards.sort((a, b) => (b.provisionsCost - a.provisionsCost));
    const golds = deck.cards.filter(c => c.cardGroup === "gold").map(c => c.localizedName).join("\n");
    let bronzes;

    let shupe = deck.cards.filter(c => c.repeatCount > 0).length === 0;
    if(shupe) {
        bronzes = deck.cards.filter(c => c.cardGroup === "bronze").map(c => c.localizedName).join("\n");
    } else {
        bronzes = deck.cards.filter(c => c.cardGroup === "bronze").map(c => (c.repeatCount + 1) + "x " + c.localizedName).join("\n");
    }

    embed.addField("Golds", golds, true);
    embed.addField("Bronzes", bronzes, true);

    return embed;
}

module.exports = {
    name: "last",
    handle: async(bot, message, locale, args) => {
        bot.db.channels.findOne({ _id: message.channel.id }, (err, doc) => {
            if(doc !== null && doc.deck !== undefined) {
                let link = forceLinkLocale(doc.deck, locale);
                axios.get(link).then(res => {
                    let deck = cheerio.load(res.data)("#root").data().state.deck;
                    if(!deck) { deck = cheerio.load(res.data)("#root").data().state.guide.deck; }
                    message.channel.send(buildDeckEmbed(bot, deck, locale));
                });
            }
        });
    }
}