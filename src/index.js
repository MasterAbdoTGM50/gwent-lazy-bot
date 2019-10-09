const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./config");

client.once("ready", () => { console.log("GWENT Lazy Bot reporting for duty"); });

client.on('message', message => {
    console.log(message.content);
});

client.login(config.token);