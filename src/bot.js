const Discord = require("discord.js");
const Datatore = require("nedb");
const path = require('path');
const axios = require("axios");

const utils = require("./utils/utils.js")
const Lisa = require("./utils/lisa");

let bot = {
    client: new Discord.Client(),
    lib: require("./data/lib.json"),
    translations: require("./data/translations"),
    cards: [],
    lisas: {},
    db: {},
    getChannelLang: async(channel) => {
        return new Promise((resolve) => {
            bot.db.channels.findOne({ _id: channel.id }, (err, doc) => {
                if(doc !== null) { resolve(doc.lang); }
                resolve("en");
            });
        });
    },
    setChannelLang: (channel, lang) => {
        if(bot.lib.locales.includes(lang.toLowerCase())) {
            bot.db.channels.update({ _id: channel.id }, { $set: { lang: lang.toLowerCase() } }, { upsert: true });
        }
    }
}

bot.client.once("ready", async () => {
    let data;
    if(process.env.LOCAL_GWENTONE) { data = require("./gwentone/cardlist.json"); }
    else {
        await axios.get("https://gwent.one/api/cardlist?language=all&key=" + process.env.API_KEY).then(res => {
            data = Object.values(res.data);
        })
    }

    parseCards(data);
    for(let locale of bot.lib.locales) { bot.lisas[locale] = new Lisa(bot.cards, "id", "name." + locale); }

    bot.db.channels = new Datatore({ filename: path.join(__dirname, "persistence/channels.nedb"), autoload: true });

    bot.actions = utils.lazyImport(path.join(__dirname, "actions"));

    bot.client.on("message", handleMessage);
    console.log("GWENT Lazy Bot! Ready!!!");
});

function parseCards(cards) {
    Object.values(cards).forEach(card => {
        let _card = {
            id: parseInt(card["id"]),
            art: parseInt(card["artid"]),
            name: card["name"],
            categories: card["category"],
            factions: [card["faction"].toLowerCase(), card["factionSecondary"].toLowerCase()],
            color: card["color"].toLowerCase(),
            rarity: card["rarity"].toLowerCase(),
            type: card["type"].toLowerCase(),
            provisions: parseInt(card["provision"]),
            power: parseInt(card["power"]),
            armor: parseInt(card["armor"]),
            ability: card["ability"],
            flavor: card["flavor"]
        }
        if(_card.type === "ability") { _card.type = "leader"; }
        bot.cards.push(_card);
    });
}

async function handleMessage(message) {
    if(message.author.bot)  return;

    for(let action of bot.actions) { action.handle(bot, message, await bot.getChannelLang(message.channel)); }
}

bot.client.login(process.env.DISCORD_TOKEN);