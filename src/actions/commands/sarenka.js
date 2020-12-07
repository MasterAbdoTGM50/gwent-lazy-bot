let path = require("path");

module.exports = {
    name: "sarenka",
    handle: async(bot, message, locale, args) => {
        message.channel.send({
            files: [{
                attachment: path.join(__dirname, "../../data/sarenka.mp3"),
                name: "sarenka.mp3"
            }]
        });
    }
}