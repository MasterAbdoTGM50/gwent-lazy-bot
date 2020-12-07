let path = require("path");

module.exports = {
    name: "doe",
    handle: async(bot, message, locale, args) => {
        message.channel.send({
            files: [{
                attachment: path.join(__dirname, "../../data/doe.mp3"),
                name: "doe.mp3"
            }]
        });
    }
}