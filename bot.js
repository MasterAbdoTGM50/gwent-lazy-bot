const Discord = require("discord.js");
const Fuse = require("fuse.js");
const fs = require("fs");
const path = require('path');

const cheerio = require("cheerio");

const axios = require("axios");
const client = new Discord.Client();

const lib = require("./data/lib");
const nicknames = require("./data/nicknames");

let chlocales = {};

let cards = {};
let fuses = {};

client.once("ready", () => {
    updateCards();
    rememberChannelLocales();
});

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

        lib.locales.forEach(locale => {
            let _cards = [];

            Object.values(res.data).forEach(card => {
                _cards.push({ id: card.id, name: card[locale] })
            });

            Object.values(nicknames.fuzzy).forEach(nickname => {
                if(nickname[locale]) {
                    _cards.push({ id: nickname.id, name: nickname[locale] })
                }
            });

            cards[locale] = _cards;
            fuses[locale] = new Fuse(cards[locale], options);
        });
    });
}

function hackDeckLocale(link, locale) {
    i = link.indexOf(".com/") + ".com/".length;
    return link.substr(0, i) + locale + link.substr(i + 2);
}

function parseDeckAsEmbed(link, locale) {
    link = hackDeckLocale(link, locale);
    return axios.get(link).then(res => {
        if(res.status === 200) {
            const html = res.data;
            let deck = cheerio.load(html)("#root").data().state.deck;
            if(!deck) { deck = cheerio.load(html)("#root").data().state.guide.deck; }

            const msg = new Discord.RichEmbed();
            msg.setTitle(deck.leader.localizedName);
            msg.setThumbnail("https://www.playgwent.com" + deck.leader.abilityImg.small);
            let color = "7f6000";
            switch(deck.leader.faction.slug.toLowerCase()) {
                case "neutral": color = "#7f6000"; break;
                case "monster": color = "#c56c6c"; break;
                case "nilfgaard": color = "#f0d447"; break;
                case "northernrealms": color = "#48c1ff"; break;
                case "scoiatael": color = "#2abd36"; break;
                case "skellige": color = "#ad39ec"; break;
                case "syndicate": color = "#e67e22"; break;
            }
            msg.setColor(color);

            msg.addField("Strategem", deck.stratagem.localizedName);

            deck.cards.sort((a, b) => (b.provisionsCost - a.provisionsCost));
            const golds = deck.cards.filter(c => c.cardGroup === "gold").map(c => c.localizedName).join("\n");
            let bronzes;

            let shupe = deck.cards.filter(c => c.repeatCount > 0).length === 0;
            if(shupe) {
                bronzes = deck.cards.filter(c => c.cardGroup === "bronze").map(c => c.localizedName).join("\n");
            } else {
                bronzes = deck.cards.filter(c => c.cardGroup === "bronze").map(c => (c.repeatCount + 1) + "x " + c.localizedName).join("\n");
            }

            msg.addField("Golds", golds, true);
            msg.addField("Bronzes", bronzes, true);

            return msg;
        }
    })
}

function setChannelLocale(channel, locale) {
    if(lib.locales.includes(locale.toLowerCase())) {
        chlocales[channel] = locale.toLowerCase();
        persistChannelLocales();
    }
}

function getChannelLocale(channel) { return chlocales[channel] ? chlocales[channel] : "en"; }

function persistChannelLocales() { fs.writeFileSync(path.join(__dirname, "persistence/chlocales.json"), JSON.stringify(chlocales, null, 2)); }

function rememberChannelLocales() {
    if(fs.existsSync(path.join(__dirname, "persistence/chlocales.json"))) {
        chlocales = JSON.parse(fs.readFileSync(path.join(__dirname, "persistence/chlocales.json")));
    }
}

client.on("message", message => {

    if(message.content.startsWith(lib.strings.prefix)) {
        let args = message.content.slice(lib.strings.prefix.length + 1).split(/ +/);
        let command = args.shift().toLowerCase();

        if(command === "update") {
            updateCards();
        } else if(command === "locale") {
            if(args.length > 0) {
                if(message.member.hasPermission("MANAGE_CHANNELS")) { setChannelLocale(message.channel.id, args[0]); }
            }
        } else if(command === "gclprefs") {
            if(message.author.id === "179631031337484288") {
                message.channel.send(JSON.stringify(chlocales));
            }
        } else if(command === "deck") {
            const regex = /(https:\/\/www\.playgwent\.com\/[a-z][a-z]\/decks\/((guides\/[0-9]*)|([a-z0-9]*)))/g;
            const found = args[0].match(regex);
            if(found !== null) {
                parseDeckAsEmbed(found[0], getChannelLocale(message.channel.id)).then(msg => message.channel.send(msg));
            }
        } else if(command === "last") {
            message.channel.fetchMessages({ limit: 100 }).then(messages => {
                const msgs = messages.array();
                const regex = /(https:\/\/www\.playgwent\.com\/[a-z][a-z]\/decks\/((guides\/[0-9]*)|([a-z0-9]*)))/g;
                for(let i = 0; i < msgs.length; ++i) {
                    const found = msgs[i].content.match(regex);
                    if(found !== null) {
                        parseDeckAsEmbed(found[0]).then(msg => message.channel.send(msg));
                        break;
                    }
                }
            });
        } else if(command === "credits") {
            message.channel.send(lib.strings.credits);
        }
    } else {
        const locale = getChannelLocale(message.channel.id);
        const regex = /\[(.*?)]/g;

        let matches = [], match;
        while ((match = regex.exec(message.content)) !== null) {
            if(match[1].trim() !== "")  { matches.push(match[1].trim()); }
        }

        matches.forEach(match => {
            let results = nicknames.exact.filter(card => card.name === match.toLowerCase());
            if(results.length !== 0) {
                message.channel.send("https://gwent.one/" + locale + "/card/" + results[0].id);
            } else {
                let _locales = [...lib.locales];
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