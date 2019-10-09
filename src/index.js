const Discord = require("discord.js");
const client = new Discord.Client();
const Fuse = require("fuse.js");

const config = require("./config");
const cards = require("./cards.json");

let nameToIdMap = [];
let fuse;

client.once("ready", () => {
    console.log("GWENT Lazy Bot reporting for duty");
    Object.values(cards).forEach((card) => {
        nameToIdMap.push({ id: card["ingameId"], name: card["name"]["en-US"] });
    });

    const options = {
        shouldSort: true,
        threshold: 0.25,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: [
            "name"
        ]
    };
    fuse = new Fuse(nameToIdMap, options);
});

client.on("message", message => {
    let regex = /\[(.*?)]/g;

    let matches = [], match;
    while ((match=regex.exec(message)) !== null) {
        matches.push(match[1]);
    }

    matches.forEach((match) => {
            let result = fuse.search(match);
            if(result.length !== 0) {
                message.channel.send("https://gwent.one/en/card/" + result[0].id);
            }
    });

});

client.login(config.token);