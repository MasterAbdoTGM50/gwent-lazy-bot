const Discord = require("discord.js");
const path = require('path');
const axios = require("axios");

const utils = require("./utils")
const Lisa = require("./lisa");

let bot = {
    client: new Discord.Client(),
    lib: require("./data/lib.json"),
    cards: [],
    lisas: {},
    translations: require("./data/translations")
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

    for(let locale of bot.lib.locales) { bot.lisas[locale] = new Lisa(bot.cards, "name." + locale); }

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

    for(let action of bot.actions) { action.handle(bot, message, "en"); }
}

bot.client.login(process.env.DISCORD_TOKEN);