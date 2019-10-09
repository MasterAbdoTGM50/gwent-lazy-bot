const Discord = require("discord.js");
const Fuse = require("fuse.js");

const axios = require("axios");
const client = new Discord.Client();
const config = require("./config");

let cards = [];
let fuse;

let creditsMsg = "Big thanks to teddybee_r for making gwent.one the source for the displayed card data. He's the true" +
    " hero behind this bot ^^\nThanks to Pinkie the Smart Elf for the amazing Profile Picture of the bot!\n" +
    "Also thanks to Jemoni and Mortin for being the maintaners of the bot in the author's absence";

client.once("ready", () => {
    updateCards();
    console.log("GWENT Lazy Bot reporting for duty!");
});

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

        console.log("GWENT Lazy Bot 'updated' for duty!");
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

client.login(config.token);