const Discord = require("discord.js");
const fs = require("fs");
const path = require('path');
const cheerio = require("cheerio");
const axios = require("axios");

const client = new Discord.Client();

const lib = require("./data/lib.json");
const nicknames = require("./data/nicknames.json");
const Lisa = require("./lisa");



let cards = [];
let lisa = null;

client.once("ready", async () => {
    await updateCards();
    client.on("message", handleMessage);
    console.log("GWENT Lazy Bot! Ready!!!")
});

async function updateCards() {
    await axios.get("https://gwent.one/api/cardlist?language=en&key=" + process.env.API_KEY).then(res => {
        Object.values(res.data).forEach(card => { cards.push({ id: card.id, name: card.name }); });
        lisa = new Lisa(cards);
    });
}

function handleMessage(message) {
    if(message.author.bot)  return;

    const regex = /\[(.*?)]/g;

    let matches = [], match;
    while((match = regex.exec(message.content)) !== null) {
        if(match[1].trim() !== "")  { matches.push(match[1].trim()); }
    }

    matches.forEach(match => {
        lisa.search(match);
    });
}

client.login(process.env.DISCORD_TOKEN);