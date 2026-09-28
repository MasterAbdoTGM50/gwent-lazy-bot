Gwent Lazy Bot
==============

____

A Discord bot for grabbing up to date card stats for CDPR's CCG [GWENT](https://www.playgwent.com).  
All card data, including previous versions, is sourced from and can be found on [gwent.one](https://gwent.one/)

### [Invite link for your server](https://discord.com/oauth2/authorize?client_id=631501475746545698&scope=bot+applications.commands&permissions=52224)

____

## Features

* Pull any card by writing its name in square brackets: `[card name]`
* Language localization for every language supported in game
* Channel specific language preferences
* Deck summaries for playgwent.com deck links
* Card data updates itself when a new game version is released
* Easter eggs

## Usage

* To pull a card just write its name within square brackets: `[card name]`. Input does not have to be exact, the
bot will do its best to find a match. Up to 10 cards per message.
* Everything else is a slash command: type `/` in Discord to see them.

![alt text](https://i.imgur.com/ugh7Pyx.png")

![alt text](https://i.imgur.com/XSmECNl.png")

![alt text](https://i.imgur.com/6a6RzA2.jpg")

## Commands

| Command | Effect |
|:--------|:-------|
| `[card name]` | shows the card (written anywhere in a message, not a slash command) |
| `/lang show` | shows the language cards are displayed in, in this channel |
| `/lang set language:` (1) | sets the language cards are displayed in, in this channel |
| `/deck link:` (2) | displays a short summary of a playgwent.com deck |
| `/deck` | without a link: shows the last deck shown with `/deck` in this channel |
| `/sound name:` | plays a classic |
| `/about` | what the bot is, who made and maintains it, and the game version of the card data |

(1) Can only be used by members with the **Manage Channels** permission  
(2) Links must be a deck or deck guide URL from the [deck section](https://www.playgwent.com/en/decks) of the official Gwent site

The old `!lazy` commands have been replaced by the slash commands above. `!lazy last` is now `/deck` without a link.
Unlike before, only decks shown through `/deck` are remembered; deck links posted in chat are no longer picked up.

## Privacy Policy

This Privacy Policy explains what information the bot uses, stores and shares.

### Short Version:
We don't store any of your messages or any personal data :)

### What information is used?
The bot reads messages in channels it can see only to look for card names written in `[square brackets]`.
Message content is processed in memory and discarded immediately. It is never stored or logged.
Deck links given to `/deck` are fetched from playgwent.com to build the summary.

### What information is stored? And for how long?
Per channel, and only when someone uses the matching command: the language chosen with `/lang set`, and the last
deck link shown with `/deck` (so `/deck` without a link can show it again). Each is kept until it is replaced.
No messages, user IDs, usernames or usage statistics are stored.

### Which security measures will protect the information?
The only stored data is a channel ID with a language code and a public deck link. It is kept on the bot's own
server and is never exposed.

### Will this information be shared with others?
No.

### How can you contact me?
I'm available most of the time on the GWENT Discord channel. If you have any concerns feel free to send them to me right away.

## Running your own copy

Requirements: [Bun](https://bun.sh) 1.4 or newer, about 250 MB of RAM (roughly 90 MB with all card data loaded,
more once connected to many servers), about 15 MB of disk, and outbound HTTPS. The bot needs no open ports.

```bash
bun install
cp .env.example .env              # then fill in DISCORD_TOKEN
bun run register-commands --yes   # after the first install and whenever commands change
bun start
```

In the [developer portal](https://discord.com/developers/applications), the bot needs the **Message Content**
intent enabled for the `[card name]` syntax.

### Deployment

Production runs on a small Ubuntu 24.04 server (1 GB RAM) as a systemd service, set up by the files in
[deploy/](deploy/) and [scripts/](scripts/):

- **Service** (`deploy/gwent-lazy-bot.service`): runs as the unprivileged `lazybot` user from
  `/home/lazybot/gwent-lazy-bot`, starts on boot, restarts after crashes (5 s, backing off to 5 min), 512 MB memory
  limit, and can only write `storage/`.
- **Logs** go to journald and are deleted after 15 days (`deploy/journald-retention.conf`).
- **Deploys:** every push to `master` runs lint, type-check and tests in GitHub Actions; if they pass, the workflow
  connects over SSH with a deploy key that can only run `scripts/deploy.sh`, which checks out that commit, installs
  packages and restarts the service (allowed by `deploy/sudoers-gwent-lazy-bot`). Re-running an older run rolls back.

**New server**, as root on a fresh Ubuntu 24.04 machine:

```bash
curl -fsSL https://raw.githubusercontent.com/MasterAbdoTGM50/gwent-lazy-bot/master/scripts/setup-server.sh | bash
```

It is safe to re-run, and ends by listing what's left: put the token in `/home/lazybot/gwent-lazy-bot/.env`, run
`systemctl enable --now gwent-lazy-bot`, and register the commands.

**Automatic deploys** need a deploy key and three secrets in a GitHub environment named `production`:

```bash
ssh-keygen -t ed25519 -N "" -C "github-actions deploy" -f lazybot_deploy      # on your machine
ssh root@<server> "bash /home/lazybot/gwent-lazy-bot/scripts/add-deploy-key.sh '$(cat lazybot_deploy.pub)'"
ssh-keyscan -t ed25519 <server>                                               # the host key line
```

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | the server's IP or hostname |
| `DEPLOY_KNOWN_HOSTS` | the `ssh-keyscan` line (check its fingerprint against `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the server) |
| `DEPLOY_SSH_KEY` | the private key file `lazybot_deploy`, then delete it locally |

To replace a lost or leaked key, repeat these steps and remove the old line from
`/home/lazybot/.ssh/authorized_keys`.

**Day to day**, as root on the server:

```bash
systemctl status gwent-lazy-bot                  # running? memory?
journalctl -u gwent-lazy-bot -f                  # follow the log
journalctl -u gwent-lazy-bot -p warning          # warnings and errors only
systemctl restart gwent-lazy-bot                 # e.g. after editing .env
su - lazybot -c 'cd gwent-lazy-bot && ~/.bun/bin/bun run register-commands --yes'   # after command changes
```

To deploy by hand, use **Run workflow** in GitHub Actions. `register-commands` prints the application and its server
count before changing anything; don't keep `--guild` copies next to the global commands, or they show up twice.

### How card data works

Card data comes from gwent.one's public API (`api.gwent.one`, key `data`). The bot keeps everything in
`storage/` in the project folder (set `DATA_DIR` to move it; the folder is git-ignored):

```
storage/
├── bot.sqlite                    per-channel language and last /deck link (a few KB); back this up
└── cache/                        safe to delete; the bot downloads the cards again
    ├── cards.json                every card in all 12 languages for the current game version (~5.5 MB)
    └── cards.previous.json       the same for the version before it, kept for comparing patches
```

- **On startup** the bot loads the card cache right away, then asks gwent.one for the current game version by
  requesting a single card, whose response includes the version. The same check runs daily.
- **Only a new version triggers a download.** Each language is fetched separately (the API's all-languages
  request times out), pinned to the version just checked, then merged into one entry per card. Missing
  translations fall back to English.
- **Bad downloads are refused:** fewer than 500 English cards, or a language with under 90% of the English
  count, leaves the current data in place. The new file is written to a temporary file and renamed, so a crash
  can't leave it half-written, and the running bot switches to the new data without a restart.
- **One version back is kept.** When the game version changes, the old `cards.json` becomes
  `cards.previous.json` (replacing the one before), ready for a future buffs/nerfs comparison. The bot never
  loads it, and re-downloading the same version leaves it alone.
- **The cache records its format.** When the card structure changes in code, an older cache is ignored and
  re-downloaded.
- Failed checks retry after an hour (after 5 minutes if there's no card data at all).
  `bun run update-cards [--force]` downloads without starting the bot.

### Project layout

```
src/
├── index.ts          startup and shutdown: config, stores, card updates, Discord login
├── bot.ts            Discord client, message and command dispatch
├── cards/            gwent.one client, parsing, card cache/store, fuzzy search (Lisa), card embeds
├── commands/         slash commands (/lang, /deck, /sound, /about)
├── messages/         message handlers ([card name] lookups, the easha easter egg)
├── decks/            playgwent.com deck page parsing and the deck embed
├── settings/         per-channel settings in SQLite
├── discord/          Discord limits and helpers
├── data/             nicknames.json, translations.json
└── config.ts, context.ts, colors.ts, urls.ts, locales.ts, time.ts, log.ts
assets/sounds/        /sound files
scripts/              register-commands, update-cards; setup-server.sh, deploy.sh, add-deploy-key.sh for the server
deploy/               systemd service, journald retention and sudoers files for the server
test/                 bun test suites and fixtures
```

### Development

```bash
bun run dev                               # restarts on file changes
bun test                                  # unit tests (no network or Discord needed)
bun run typecheck
bun run format                            # format, fix lint issues, sort imports (Biome)
bun run lint                              # check the same without changing files
bun run register-commands --guild <id>    # instant command updates in a test server
```

Use a separate test application and server for development rather than the production token.

Formatting and linting use [Biome](https://biomejs.dev) (`biome.json`). For format-on-save, install the Biome
extension for your editor.

## Credits

1. **MasterAbdoTGM50:** Author
2. **teddybee_r:** Owner and creator of [gwent.one](https://gwent.one/)  
3. **Pinkie the Smart Elf:** Creator of the profile picture for the bot  
4. **Jemoni:** Maintaining the bot in the author's absence and helping create the profile picture for the bot  
5. **Mortin:** Maintaining the bot in the author's absence and creating/maintaining documentation 
