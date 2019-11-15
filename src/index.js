const Discord = require("discord.js");
const Fuse = require("fuse.js");

const axios = require("axios");
const client = new Discord.Client();

let cards = [];
let fuse;

let creditsMsg =
    "**teddybee_r:** Making gwent.one the source for the displayed card data. He's the true hero behind this bot ^^\n" +
    "**Pinkie the Smart Elf:** The amazing profile picture of the bot!\n" +
    "**Jemoni:** Maintaining the bot in the author's absence and helping in the amazing profile picture of the bot!\n" +
    "**Mortin:** Maintaining the bot in the author's absence";

client.once("ready", updateCards);

function updateCards() {
    axios.get("https://gwent.one/cardbot").then(res => {
        let _cards = [];
        Object.values(res.data).forEach((card) => {
            _cards.push(card);
        });
        cards = _cards;

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

        fuse = new Fuse(cards, options);
    });
}

client.on("message", message => {

    if(message.content === "!lazy_update") {
        updateCards();
    } else if(message.content === "!lazy_credits") {
        message.channel.send(creditsMsg);
    } else {
        let regex = /\[(.*?)]/g;

        let matches = [], match;
        while ((match=regex.exec(message.content)) !== null) {
            matches.push(match[1]);
        }

        matches.forEach((match) => {
            let result = fuse.search(match);
            if(result.length !== 0) {
                message.channel.send("https://gwent.one/en/card/" + result[0].id);
            }
        });
    }
});

client.login(process.env.DISCORD_TOKEN);