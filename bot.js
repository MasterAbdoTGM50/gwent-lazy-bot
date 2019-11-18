const Discord = require("discord.js");
const Fuse = require("fuse.js");

const axios = require("axios");
const client = new Discord.Client();

const locales = ["en", "cn", "de", "es", "fr", "it", "jp", "kr", "mx", "pl", "pt", "ru"];
const nicknames = require("./nicknames");

let channelLocales = {};

let cards = {};
let fuses = {};

const commandPrefix = "!lazy";

const creditsMsg =
    "**teddybee_r:** Making gwent.one the source for the displayed card data. He's the true hero behind this bot ^^\n" +
    "**Pinkie the Smart Elf:** The amazing profile picture of the bot!\n" +
    "**Jemoni:** Maintaining the bot in the author's absence and helping in the amazing profile picture of the bot!\n" +
    "**Mortin:** Maintaining the bot in the author's absence";

client.once("ready", updateCards);

function updateCards() {
    axios.get("https://gwent.one/cardbot").then(res => {
        const options = {
            shouldSort: true,
            tokenize: true,
            threshold: 0.25,
            location: 0,
            distance: 32,
            maxPatternLength: 32,
            minMatchCharLength: 3,
            keys: ["name"]
        };

        locales.forEach(locale => {
            let _cards = [];

            Object.values(res.data).forEach(card => {
                _cards.push({ id: card.id, name: card[locale] })
            });

            _cards.push(...nicknames.fuzzy.global);
            if(nicknames.fuzzy[locale]) { _cards.push(...nicknames.fuzzy[locale]); }

            cards[locale] = _cards;
            fuses[locale] = new Fuse(cards[locale], options);
        });
    });
}

function setChannelLocale(channel, locale) { if(locales.includes(locale.toLowerCase())) { channelLocales[channel] = locale.toLowerCase(); } }
function getChannelLocale(channel) { return channelLocales[channel] ? channelLocales[channel] : "en"; }

client.on("message", message => {

    if(message.content.startsWith(commandPrefix)) {
        let args = message.content.slice(commandPrefix.length + 1).split(/ +/);
        let command = args.shift().toLowerCase();

        if(command === "update") {
            updateCards();
        } else if(command === "locale") {
            if(args.length > 0) {
                if(message.member.hasPermission("MANAGE_CHANNELS")) { setChannelLocale(message.channel.id, args[0]); }
            }
        } else if(command === "gprefs") {
            if(message.author.id === "179631031337484288") {
                message.channel.send(JSON.stringify(channelLocales));
            }
        } else if(command === "credits") {
            message.channel.send(creditsMsg);
        }
    } else {
        const locale = getChannelLocale(message.channel.id);
        const regex = /\[(.*?)]/g;

        let matches = [], match;
        while ((match = regex.exec(message.content)) !== null) { matches.push(match[1]); }

        matches.forEach(match => {
            let results = nicknames.exact.filter(card => card.name === match.toLowerCase());
            if(results.length !== 0) {
                message.channel.send("https://gwent.one/" + locale + "/card/" + results[0].id);
            } else {
                let _locales = [...locales];
                _locales.sort((a, b) => a === locale ? -1 : b === locale ? 1 : 0);

                let results = [];
                for(let i = 0; i < _locales.length; ++i) {
                    results = fuses[_locales[i]].search(match);

                    if(results.length !== 0) {
                        message.channel.send("https://gwent.one/" + _locales[i] + "/card/" + results[0].id);
                        break;
                    }
                }
            }
        });
    }
});

client.login(process.env.DISCORD_TOKEN);