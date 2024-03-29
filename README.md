Gwent Lazy Bot
==============

____

A Discord bot for grabbing up to date card stats for CDPR's CCG [GWENT](https://www.playgwent.com).  
All card data, including previous versions, is sourced from and can be found on [gwent.one](https://gwent.one/)

### [Invite link for your server](https://discordapp.com/oauth2/authorize?client_id=631501475746545698&scope=bot)

____

## Features

* Simple regex pattern for pulling card data
* Language localization for every language supported in game
* Channel specific language preferences
* Easter eggs

## Usage

* To pull a card just write its name within square brackets: `[card name]`. Input does not have to be exact, the   
bot will do it's best to find a match
* To use a command type **!lazy** followed by the desired command

![alt text](https://i.imgur.com/ugh7Pyx.png")

![alt text](https://i.imgur.com/XSmECNl.png")

![alt text](https://i.imgur.com/6a6RzA2.jpg")

## Commands

| Command         | Effect           |Usage              |
|:----------------|:-----------------|:------------------|
| update          | pulls the latest card data from our source | !lazy update |
| lang set (1)      | used in combination with a language code to set the channels preferred language | !lazy lang set __ (2) |
| credits         | displays those involved with the creation and maintenance of this bot / data | !lazy credits |
| deck         	  | displays a short summary of the linked deck | !lazy deck _______ (3) |
| last            | displays the last deck linked with the !lazy deck command in this channel, as long as it is within the last 100 messages  | !lazy last |

(1) Can only be used by members with the `MANAGE_CHANNELS` flag  
(2) Supported language codes include: `"en", "cn", "de", "es", "fr", "it", "jp", "kr", "mx", "pl", "pt", "ru"`  
(3) Links must be a deck URL from the [deck section](https://www.playgwent.com/en/decks) of the official Gwent site, as in the image above.

## Privacy Policy

This Privacy Policy explains how we collect, use, store, protect, and share your personal information through our services.

### Short Version: 
We don't store and of your data :)

The only way Gwent Lazy Bot uses your messages is by reading said message from a channel it can read from then parse it to figure out which cards you mentioned. We don't store any of your messages nor any statistics on the usage of the commands.

### What information will be collected?
None at all. The only information used is the message content itself to get the names of the cards to be mentioned and that data is discarded after that.

### How will the information be stored? And for how long?
It's not stored in any persisted in any way. It's loaded in memory once for parsing then discarded immeditetly. It's not persisted to any physical layer or way.

### Which security measures will protect the information?
Since the bot doesn't store any data there is no need for such measures.

### Will this information be shared with others?
Not at all since there is no data stored and no live statistics are even done on the usage.

### How can you contact me?
I'm available most of the time on the GWENT Discord channel. If you have any concerns feel free to send them to me right away.

## Credits

1. **MasterAbdoTGM50:** Author
2. **teddybee_r:** Owner and creator of [gwent.one](https://gwent.one/)  
3. **Pinkie the Smart Elf:** Creator of the profile picture for the bot  
4. **Jemoni:** Maintaining the bot in the author's absence and helping create the profile picture for the bot  
5. **Mortin:** Maintaining the bot in the author's absence and creating/maintaining documentation 
