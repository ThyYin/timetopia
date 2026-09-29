# TimeTopia

TimeTopia is a Discord bot that tells you the current local time for a country, city, or timezone.

It works in many servers at once. Time is calculated on the machine running the bot with Node's built-in timezone data. It does not call a paid time API, and it does not need a database.

No `GUILD_ID` is required. TimeTopia is designed for global/multi-server deployment.

## Features

| Feature         | What it does                                       |
| --------------- | -------------------------------------------------- |
| `/time`         | Slash command with autocomplete                    |
| `/list`         | Slash search for supported places                  |
| `tm!time`       | Prefix command, including names with spaces        |
| `tm!list`       | Search supported places, for example `tm!list Mal` |
| Country lookup  | `Japan`, `Malaysia`, `United Kingdom`              |
| City lookup     | `Tokyo`, `Kuala Lumpur`, `New York`                |
| IANA lookup     | `Asia/Tokyo`, `Europe/London`, `America/New_York`  |
| Abbreviations   | `JP`, `MY`, `SG`, `UK`, `NYC`, `LA`, `KL`          |
| Ambiguous names | Asks you to choose instead of guessing             |
| Daylight saving | Offset changes with the date, using IANA rules     |
| Multi-server    | Slash commands are registered globally             |

## Commands

| Command             | Example                | Notes                                     |
| ------------------- | ---------------------- | ----------------------------------------- |
| Prefix              | `tm!time Japan`        | Needs the Message Content intent          |
| Prefix, no location | `tm!time`              | The bot asks you for a place              |
| Place list          | `tm!list`              | Browse every supported place              |
| Place search        | `tm!list Mal`          | Shows matches such as Malaysia and Malawi |
| Prefix help         | `tm!help`              | Usage reminder in an embed                |
| Slash               | `/time location:Japan` | Suggestions appear while you type         |
| Slash list          | `/list query:Mal`      | Same search as `tm!list`                  |

Normal members can use these commands. The bot does not ask for admin permissions. Help, errors, time results, and the place list are all embeds.

### If `/time` does not appear

Restart the bot, then fully quit and reopen Discord. Slash commands are registered for servers. If the command is still missing, open the invite link above again so the server has the `applications.commands` scope.

A successful lookup looks like this:

```text
🇯🇵 Japan — Tokyo

🕐 10:35 PM
📅 Tuesday, 29 September 2026
🌐 Asia/Tokyo
🕓 UTC+09:00
```

Times use 12-hour format (`10:35 PM`). Dates look like `Tuesday, 29 September 2026`. The UTC offset is calculated for that timezone at the current moment, so daylight saving is included.

## Requirements

| Tool                | Version                           |
| ------------------- | --------------------------------- |
| Node.js             | 20 or newer                       |
| npm                 | Comes with Node                   |
| Discord application | A bot token and an application ID |

## Discord Developer Portal

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**. Name it `TimeTopia`.
2. Open **Installation** or **OAuth2 → URL Generator**. This bot does not use a server id.
3. Copy the **Application ID** from **General Information**. That value is `DISCORD_CLIENT_ID`.
4. Open the **Bot** tab, click **Reset Token**, and copy the token. That value is `DISCORD_TOKEN`. Treat the token like a password.
5. On the **Bot** tab, under **Privileged Gateway Intents**, turn on **Message Content Intent**. Leave **Presence Intent** and **Server Members Intent** off.

   Message Content Intent is required for `tm!` commands, because Discord hides message text unless you turn it on. Slash commands still work without it, but prefix commands will look silent if it is off.

6. In **OAuth2 → URL Generator**, select these scopes:
   - `bot`
   - `applications.commands`
7. Select only these bot permissions:
   - View Channels
   - Send Messages
   - Embed Links
   - Read Message History

   You can also use this invite link after you replace the client id:

   ```text
   https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=84992
   ```

8. Open the generated URL and add the bot to a server where you can test it.

Global slash commands can take up to an hour to appear in every server. Prefix commands work as soon as the bot is online and the Message Content intent is on.

## Installation

```bash
git clone <repository>
cd timetopia
npm install
```

Create your env file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Fill in `.env`:

```env
DISCORD_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-application-id
```

Those are the only settings the bot reads. Do not add `GUILD_ID`.

## Development

```bash
npm run dev
```

This restarts the bot when you change a file. You still need a valid `.env`.

## Build

```bash
npm run build
```

TypeScript compiles `src/` into `dist/`. The file you run in production is `dist/index.js`.

## Deploy slash commands

```bash
npm run deploy-commands
```

This registers `/time` for the whole application, not for one server. The bot also registers global commands when it logs in, so a normal start does the same job. Discord may take a while to show a newly registered global command.

`npm run deploy-commands` replaces this application's existing global commands with the commands in this project.

## Production

From the project folder, after `npm install` and `npm run build`:

```bash
npm start
```

`npm start` runs `node dist/index.js`.

### Google Cloud VM and pm2

On a VM, install dependencies, build, then start the compiled file with pm2:

```bash
npm install
npm run build
pm2 start dist/index.js --name "timetopia"
pm2 save
```

Run that from the project folder. The compiled bot loads `.env` from the folder above `dist/`, so the token is found even though pm2 is running `dist/index.js`.

Useful pm2 commands:

| Command                 | What it does                                                                   |
| ----------------------- | ------------------------------------------------------------------------------ |
| `pm2 logs timetopia`    | Shows the bot's logs                                                           |
| `pm2 restart timetopia` | Restarts it after you pull changes and rebuild                                 |
| `pm2 stop timetopia`    | Stops it                                                                       |
| `pm2 startup`           | Optional. Run once so pm2 comes back after a reboot, then run `pm2 save` again |

After you change the code on the VM:

```bash
npm install
npm run build
pm2 restart timetopia
```

Startup logs look like this:

```text
[INFO] TimeTopia starting...
[INFO] Logged in as TimeTopia#0000
[INFO] Connected to Discord
[INFO] Global slash commands registered
```

The bot never prints `DISCORD_TOKEN`.

## Scripts

| Script                    | What it does                           |
| ------------------------- | -------------------------------------- |
| `npm run dev`             | Run from TypeScript while you code     |
| `npm run build`           | Compile to `dist/index.js`             |
| `npm start`               | Run the compiled bot                   |
| `npm run deploy-commands` | Register `/time` globally              |
| `npm test`                | Run the tests                          |
| `npm run lint`            | Check code style                       |
| `npm run format`          | Format the project                     |
| `npm run format:check`    | Check formatting without writing files |

## Add a place

Open `src/data/locations.ts` and add a `place()` entry with an IANA timezone id, such as `Asia/Tokyo`.

If the name can mean more than one place, do not give both entries the same alias. Add the shared name to `ambiguousAliases` so the bot asks the user to pick.

Timezone math stays in `src/services/timezoneService.ts`. You do not hardcode UTC offsets.

## Project layout

```text
src/
├── commands/          slash command definitions
├── data/locations.ts  names, aliases, and timezone ids
├── handlers/          Discord events
├── services/          location lookup and clock math
├── utils/             embeds, flags, logs, cooldown
├── config.ts          reads .env
├── deploy-commands.ts registers global slash commands
└── index.ts           process entry, compiled to dist/index.js
```

## Decisions and limits

| Topic                                                               | How TimeTopia handles it                                                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| United States, Australia, Canada, Brazil, Mexico, Russia, Indonesia | Asks you to pick a city or region                                                                                |
| Georgia, Portland, Springfield, Washington, Birmingham              | Asks you to pick, because the name is used in more than one place                                                |
| `CA`                                                                | Asks you to choose between California and major Canadian cities                                                  |
| `LA`                                                                | Los Angeles                                                                                                      |
| `Korea`                                                             | South Korea. North Korea is `North Korea`                                                                        |
| Spain, France, Portugal, New Zealand, Chile                         | Uses the main civil timezone. Smaller territories have their own entries when included, such as `Canary Islands` |
| Texas and Florida                                                   | Uses the timezone used by most of the state                                                                      |
| London                                                              | London, United Kingdom                                                                                           |
| China                                                               | `Asia/Shanghai`, which is the civil time used across China                                                       |
| Very small towns                                                    | Not all of them are included. Add them in `src/data/locations.ts`                                                |
| Cooldown                                                            | About 1 second per user, stored in memory. It resets when the process restarts                                   |
| Discord live timestamps                                             | Not used. Discord renders those in the viewer's own timezone, which would hide the place you asked about         |

Future commands such as `/timediff` or server timezone settings can be added as new files under `src/commands/` without rewriting the clock or the location list.
