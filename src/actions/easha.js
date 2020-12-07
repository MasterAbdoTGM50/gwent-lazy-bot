module.exports = {
    handle(bot, message, locale) {
        if(message.mentions.has("288328490506387457")) {
            let easha = message.guild.member("288328490506387457");
            if(easha !== null) {
                if(easha.lastMessage.createdAt !== null) {
                    let time = (easha.lastMessage.createdAt.getTime() - message.createdAt.getTime()) / 1000;
                    if(time < 15) {
                        message.channel.send("<@" + message.author.id + "> don't ping our lady! she's been active 15 minutes ago!!!");
                    }
                }

            }
        }
    }
}