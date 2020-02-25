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
| locale (1)      | used in combination with a language code to set the channels preferred language | !lazy locale __ (2) |
| credits         | displays those involved with the creation and maintenance of this bot / data | !lazy credits |
| deck         	  | displays a short summary of the linked deck | !lazy deck _______ (3) |
| last            | displays the last deck linked with the !lazy deck command in this channel, as long as it is within the last 100 messages  | !lazy last |

(1) Can only be used by members with the `MANAGE_CHANNELS` flag  
(2) Supported language codes include: `"en", "cn", "de", "es", "fr", "it", "jp", "kr", "mx", "pl", "pt", "ru"`  
(3) Links must be a deck URL from the [deck section](https://www.playgwent.com/en/decks) of the official Gwent site, as in the image above.

## Credits

1. **MasterAbdoTGM50:** Author
2. **teddybee_r:** Owner and creator of [gwent.one](https://gwent.one/)  
3. **Pinkie the Smart Elf:** Creator of the profile picture for the bot  
4. **Jemoni:** Maintaining the bot in the author's absence and helping create the profile picture for the bot  
5. **Mortin:** Maintaining the bot in the author's absence and creating/maintaining documentation 
