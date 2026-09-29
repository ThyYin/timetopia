# Discord Timezone Bot — Full Build Specification

## 1. Project Overview

Build a production-ready Discord bot called **TimeTopia**.

The bot's primary purpose is to let users retrieve the current local time for a country, city, region, or timezone directly inside Discord.

The bot must work across **multiple Discord servers**. It must NOT be hardcoded to a single guild/server.

The bot should support both:

* Prefix commands
* Discord slash commands

### Prefix

```text
tm!time <location>
```

Example:

```text
tm!time Japan
tm!time Malaysia
tm!time Tokyo
tm!time New York
tm!time London
```

### Slash command

```text
/time <location>
```

The final bot should be fully functional from start to finish. **Do not build it in stages or stop after scaffolding. Implement the complete application in one pass.**

---

# 2. Technology Stack

Use:

* Node.js
* TypeScript
* discord.js v14+
* npm
* Native JavaScript/Node.js internationalisation APIs where appropriate
* IANA timezone identifiers/database
* `Intl.DateTimeFormat`
* ESLint
* Prettier
* dotenv

Do NOT use Next.js for the Discord bot runtime.

Next.js is unnecessary for the bot itself.

Do NOT use a database for the initial implementation.

Do NOT use an external paid timezone API.

Do NOT require an API key for timezone/time retrieval.

The bot should calculate the current time locally using timezone information rather than making an HTTP request every time someone uses `/time`.

---

# 3. Important Environment Variable Requirement

The bot will be deployed globally and used across many Discord servers.

Therefore:

**DO NOT create or require a `GUILD_ID` environment variable.**

There must be no guild-specific configuration.

The `.env` file should contain only the credentials/configuration genuinely required by the bot.

Expected `.env`:

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
```

If the implementation requires another genuinely necessary environment variable, document why it is needed.

Do NOT add:

```env
GUILD_ID=
```

Do not use guild-specific command registration.

Slash commands must be registered **globally** so the bot can be used across servers.

---

# 4. Bot Identity

Bot name:

```text
TimeTopia
```

Prefix:

```text
tm!
```

Primary command:

```text
tm!time
```

Slash command:

```text
/time
```

The codebase should make it easy to change the bot name or prefix later.

---

# 5. Core Functionality

The bot must accept natural location input and resolve it into an IANA timezone.

Examples:

```text
Japan
Malaysia
Singapore
South Korea
China
United Kingdom
United States
Australia
Germany
France
Tokyo
Osaka
Kuala Lumpur
Singapore
Seoul
London
New York
Los Angeles
Sydney
Melbourne
California
```

The resolver should ultimately map supported locations to IANA timezone identifiers such as:

```text
Asia/Tokyo
Asia/Kuala_Lumpur
Asia/Singapore
Asia/Seoul
Asia/Shanghai
Europe/London
America/New_York
America/Los_Angeles
Australia/Sydney
Australia/Melbourne
```

Use a maintainable mapping/resolution architecture.

Do NOT hardcode timezone calculation logic for individual locations.

The location resolver and timezone calculation should be separate modules.

---

# 6. Location Resolution

Implement a robust location resolver.

It should support:

### Countries

```text
Malaysia
Japan
Singapore
United States
United Kingdom
Australia
Germany
France
```

### Cities

```text
Tokyo
Osaka
Kuala Lumpur
Singapore
London
New York
Los Angeles
Sydney
Melbourne
```

### Common abbreviations

Where sensible, support aliases such as:

```text
MY
JP
SG
UK
US
USA
NYC
LA
KL
```

However, avoid ambiguous mappings where the input cannot reliably identify a timezone.

For example:

```text
Portland
Springfield
Georgia
```

can be ambiguous.

The bot should handle ambiguous locations safely rather than silently returning a potentially incorrect timezone.

---

# 7. IANA Timezone Handling

Use IANA timezone identifiers internally.

Examples:

```text
Asia/Kuala_Lumpur
Asia/Tokyo
Asia/Singapore
Europe/London
America/New_York
America/Los_Angeles
Australia/Sydney
```

Use Node.js `Intl.DateTimeFormat` or another reliable built-in mechanism to calculate the local time.

Do NOT manually calculate UTC offsets.

Do NOT hardcode DST rules.

Do NOT assume an offset such as UTC+8 permanently represents every location.

DST must be handled automatically by the timezone engine.

---

# 8. Time Formatting

Display:

* Local time
* Local date
* Day of the week
* UTC offset
* IANA timezone
* Location name
* Appropriate flag where available

Example:

```text
🇯🇵 Japan — Tokyo

🕐 10:35 PM
📅 Tuesday, 29 September 2026
🌐 Asia/Tokyo
🕓 UTC+09:00
```

For Malaysia:

```text
🇲🇾 Malaysia — Kuala Lumpur

🕐 9:35 PM
📅 Tuesday, 29 September 2026
🌐 Asia/Kuala_Lumpur
🕓 UTC+08:00
```

Use Discord embeds for the response.

Make the embed clean and readable.

Do not make it unnecessarily huge.

---

# 9. Discord Slash Command

Create:

```text
/time
```

with:

```text
location
```

as a required string option.

Example:

```text
/time location:Japan
```

The command should provide autocomplete suggestions.

When the user types:

```text
/time location:Jap
```

Discord should suggest something similar to:

```text
🇯🇵 Japan
🇯🇵 Tokyo
🇯🇵 Osaka
```

Autocomplete should be fast and must not make unnecessary external API calls.

Limit autocomplete results to Discord's supported maximum.

---

# 10. Prefix Command

Implement:

```text
tm!time <location>
```

Examples:

```text
tm!time Japan
tm!time Malaysia
tm!time Tokyo
tm!time New York
```

The parser must support locations containing spaces.

For example:

```text
tm!time New York
tm!time Los Angeles
tm!time Kuala Lumpur
tm!time United Kingdom
```

must work correctly.

---

# 11. Prefix Help

If the user sends:

```text
tm!time
```

without a location, return a helpful response.

Example:

```text
❌ Please provide a location.

Examples:
tm!time Japan
tm!time Malaysia
tm!time Tokyo
tm!time New York

You can also use:
/time <location>
```

Do not crash.

---

# 12. Unknown Location Handling

If the location cannot be resolved:

```text
tm!time Wakanda
```

return a friendly error.

Example:

```text
❌ I couldn't find a timezone for `Wakanda`.

Try a country, city, or recognised timezone.

Examples:
• Japan
• Malaysia
• Tokyo
• New York
• Europe/London
```

Do not expose stack traces to Discord users.

---

# 13. Timezone Input

Allow users to enter a valid IANA timezone directly.

Example:

```text
tm!time Asia/Tokyo
tm!time Europe/London
tm!time America/New_York
```

If the provided string is a valid IANA timezone, use it directly.

This should be validated safely.

Do not accept arbitrary invalid timezone strings.

---

# 14. Case Insensitivity

Location matching should be case-insensitive.

These should behave identically:

```text
tm!time japan
tm!time Japan
tm!time JAPAN
tm!time jApAn
```

Likewise:

```text
/time location:malaysia
/time location:Malaysia
```

---

# 15. Discord Permissions

The `/time` command should be usable by normal members.

Do not require administrator permissions.

Do not require moderator permissions.

The bot should only require the minimum Discord permissions necessary.

The bot should not request unnecessary privileged permissions.

---

# 16. Intents

Only enable the Discord Gateway intents actually required.

Avoid unnecessary privileged intents.

If the prefix command requires message content intent, configure it properly and document the requirement.

The implementation should clearly explain which intents must be enabled in the Discord Developer Portal.

---

# 17. Error Handling

Implement proper error handling for:

* Invalid timezone
* Unknown location
* Missing command arguments
* Discord API errors
* Command registration errors
* Unexpected runtime exceptions
* Invalid environment variables
* Bot login failure
* Invalid user input

The bot must never crash because a user entered bad input.

Use a central error-handling strategy where practical.

---

# 18. Logging

Implement clean console logging.

On startup, display something similar to:

```text
[INFO] TimeTopia starting...
[INFO] Logged in as TimeTopia#0000
[INFO] Connected to Discord
[INFO] Global slash commands registered
```

Errors should look like:

```text
[ERROR] Failed to register commands
```

Avoid dumping unnecessary sensitive information.

NEVER log:

```text
DISCORD_TOKEN
```

or any secret.

---

# 19. Project Structure

Use a clean scalable structure.

For example:

```text
timetopia/
├── src/
│   ├── commands/
│   │   └── time.ts
│   │
│   ├── handlers/
│   │   ├── interactionHandler.ts
│   │   └── messageHandler.ts
│   │
│   ├── services/
│   │   ├── timezoneService.ts
│   │   └── locationResolver.ts
│   │
│   ├── utils/
│   │   ├── formatter.ts
│   │   ├── flags.ts
│   │   └── logger.ts
│   │
│   ├── config.ts
│   ├── deploy-commands.ts
│   └── index.ts
│
├── .env.example
├── .gitignore
├── eslint.config.*
├── prettier.config.*
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

You may modify the structure if there is a technically better architecture, but maintain clear separation of:

* Discord command handling
* Location resolution
* Timezone logic
* Formatting
* Configuration
* Logging

---

# 20. Command Registration

Create a command deployment script.

For example:

```text
npm run deploy-commands
```

It must register:

```text
/time
```

globally.

Do NOT require a guild ID.

Do NOT use:

```text
Routes.applicationGuildCommands(...)
```

unless there is a compelling reason unrelated to production registration.

Prefer the global application command endpoint.

Document that global Discord slash command propagation may take some time.

---

# 21. Package Scripts

Provide sensible npm scripts.

At minimum:

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "start": "...",
    "deploy-commands": "...",
    "lint": "...",
    "format": "...",
    "format:check": "..."
  }
}
```

The project must build successfully.

The production start command should execute compiled JavaScript rather than relying on TypeScript execution.

---

# 22. TypeScript Configuration

Use strict TypeScript.

Enable appropriate strict settings.

Avoid:

```ts
any
```

unless genuinely unavoidable.

Prefer explicit types.

The project should compile cleanly with:

```text
npm run build
```

No TypeScript errors should remain.

---

# 23. Security

Follow basic production security practices.

Requirements:

* Never hardcode the Discord bot token.
* Never commit `.env`.
* Include `.env` in `.gitignore`.
* Include `.env.example`.
* Validate environment variables at startup.
* Do not expose secrets in logs.
* Validate user input.
* Avoid unsafe dynamic evaluation.
* Do not execute shell commands based on user input.
* Do not trust arbitrary timezone strings without validation.

---

# 24. Rate Limiting / Abuse Protection

Because this bot will be publicly available across multiple Discord servers, implement sensible lightweight protection against command spam.

Do not build an overly complicated distributed rate limiter.

A simple in-memory per-user cooldown is sufficient initially.

For example:

```text
User can invoke time command:
once every ~1 second
```

Apply this to both:

```text
tm!time
```

and:

```text
/time
```

The bot should remain responsive for normal usage.

Do not rate-limit the entire bot globally based on one user's activity.

---

# 25. Flag Support

Create a maintainable country-to-emoji mapping where appropriate.

Examples:

```text
Malaysia → 🇲🇾
Japan → 🇯🇵
Singapore → 🇸🇬
United Kingdom → 🇬🇧
United States → 🇺🇸
Australia → 🇦🇺
Germany → 🇩🇪
```

Do not attempt to generate flags for arbitrary city names.

If no reliable flag exists, simply omit the flag.

---

# 26. Location Data Architecture

Keep location aliases separate from timezone calculation.

For example:

```ts
{
  aliases: ["malaysia", "my"],
  name: "Malaysia",
  timezone: "Asia/Kuala_Lumpur",
  flag: "🇲🇾"
}
```

For cities:

```ts
{
  aliases: ["tokyo"],
  name: "Tokyo",
  timezone: "Asia/Tokyo",
  flag: "🇯🇵"
}
```

The architecture should make adding locations later easy.

Do not scatter location mappings throughout command handlers.

---

# 27. Ambiguous Locations

Handle ambiguity carefully.

For example:

```text
tm!time Georgia
```

could refer to:

* Georgia the country
* Georgia the US state

Do not silently pick one if the input is genuinely ambiguous.

Instead, return something such as:

```text
⚠️ `Georgia` is ambiguous.

Did you mean:

🇬🇪 Georgia (country)
🇺🇸 Georgia (United States)
```

For slash-command autocomplete, present the options clearly.

Design the resolver so ambiguous aliases can return multiple candidates.

---

# 28. Timezone Offset Formatting

Do not simply display:

```text
UTC+8
```

based on a static mapping.

Calculate the actual offset for the requested timezone at the current date/time.

Examples:

```text
UTC+08:00
UTC+09:00
UTC-04:00
UTC+01:00
```

This is important for DST-observing regions.

---

# 29. 12/24 Hour Format

Use a consistent format for the bot.

Default to:

```text
12-hour format
```

with AM/PM.

For example:

```text
10:35 PM
```

The date should use a readable format:

```text
Tuesday, 29 September 2026
```

Keep formatting consistent across all locations.

---

# 30. Discord Embed Design

Use a clean embed.

Suggested structure:

```text
🇯🇵 Japan — Tokyo

🕐 10:35 PM
📅 Tuesday, 29 September 2026

🌐 Asia/Tokyo
🕓 UTC+09:00
```

Footer:

```text
TimeTopia • Timezone information
```

Do not include unnecessary API/provider branding because the bot should not rely on an external time API.

Use the Discord timestamp feature where useful, but ensure the displayed local timezone information is explicit.

---

# 31. README

Create a complete README explaining:

## Features

* `/time`
* `tm!time`
* Country lookup
* City lookup
* IANA timezone lookup
* Autocomplete
* DST-aware timezone handling
* Multi-server support
* Prefix command
* Slash command

## Requirements

Explain:

* Node.js version
* npm
* Discord application
* Bot token

## Installation

Example:

```bash
git clone <repository>
cd timetopia
npm install
```

Then:

```bash
cp .env.example .env
```

Explain how to populate:

```env
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
```

Explicitly state:

> No `GUILD_ID` is required. TimeTopia is designed for global/multi-server deployment.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy commands

```bash
npm run deploy-commands
```

## Production

```bash
npm start
```

---

# 32. Discord Developer Portal Documentation

Explain in the README how to configure the bot.

Mention:

* Create a Discord application
* Create a bot
* Copy the bot token
* Copy the Application/Client ID
* Enable the required intents
* Generate an OAuth2 installation URL
* Install the bot into a test server
* Ensure the bot has the required application scopes

Use:

```text
bot
applications.commands
```

Do not request unnecessary permissions.

If Message Content Intent is required for `tm!` prefix commands, explicitly explain that it must be enabled in the Discord Developer Portal.

---

# 33. Testing

Create automated tests for the important pure logic.

At minimum test:

### Location resolution

```text
Japan → Asia/Tokyo
Malaysia → Asia/Kuala_Lumpur
Tokyo → Asia/Tokyo
New York → America/New_York
```

### Case insensitivity

```text
japan
Japan
JAPAN
```

should resolve identically.

### IANA input

```text
Asia/Tokyo
Europe/London
America/New_York
```

should validate correctly.

### Invalid timezone

```text
Not/A_Timezone
```

should fail gracefully.

### Ambiguous input

Ensure ambiguous locations do not silently resolve to the wrong timezone.

### UTC offset

Verify that the generated UTC offset is calculated dynamically.

---

# 34. Code Quality

The implementation should be:

* Clean
* Modular
* Typed
* Maintainable
* Production-oriented
* Easy to extend

Avoid:

* Giant `index.ts`
* Repeated timezone logic
* Repeated Discord response code
* Hardcoded secrets
* Hardcoded UTC offsets
* Unnecessary dependencies
* Unnecessary API requests
* Unnecessary database usage

Use small focused modules.

---

# 35. Important Design Principle

The architecture should make it possible to add future features without rewriting the entire bot.

Potential future features may include:

```text
/timediff
/timer
/worldclock
/timezone
/settimezone
/mytime
```

or server-specific features such as:

```text
/tzset
/tzlist
```

Do not implement these future features now unless necessary.

Simply make the current architecture extensible enough to support them later.

---

# 36. Final Acceptance Criteria

The project is considered complete only when all of the following are true:

* [ ] TypeScript project created
* [ ] Node.js runtime configured
* [ ] discord.js installed and configured
* [ ] `.env` configuration implemented
* [ ] `.env.example` created
* [ ] No `GUILD_ID`
* [ ] Global slash command registration implemented
* [ ] `/time` implemented
* [ ] `tm!time` implemented
* [ ] Location aliases implemented
* [ ] Country lookup implemented
* [ ] City lookup implemented
* [ ] IANA timezone lookup implemented
* [ ] Case-insensitive lookup implemented
* [ ] Ambiguous location handling implemented
* [ ] Slash-command autocomplete implemented
* [ ] DST-aware time calculation implemented
* [ ] Dynamic UTC offset implemented
* [ ] Discord embed response implemented
* [ ] Invalid input handling implemented
* [ ] Error handling implemented
* [ ] Logging implemented
* [ ] Lightweight rate limiting implemented
* [ ] Tests implemented
* [ ] ESLint configured
* [ ] Prettier configured
* [ ] Production build works
* [ ] README completed
* [ ] Discord Developer Portal setup documented
* [ ] No secrets committed
* [ ] No paid/external timezone API required

---

# 37. Execution Instructions for the Cursor Agent

You are the primary implementation agent.

**Do not stop at planning.**

**Do not ask me to manually implement individual components.**

**Do not build this phase by phase.**

Instead:

1. Inspect the current project directory.
2. Determine whether an existing project needs to be adapted or whether the project should be initialised.
3. Create the complete project structure.
4. Install/configure all required dependencies.
5. Implement all functionality described above.
6. Implement tests.
7. Run the TypeScript build.
8. Run linting.
9. Run formatting checks.
10. Run the test suite.
11. Fix all errors discovered during those checks.
12. Review the implementation for security issues and unnecessary dependencies.
13. Ensure there is no `GUILD_ID` anywhere in the configuration or command-registration flow.
14. Ensure slash commands are registered globally.
15. Ensure both prefix and slash commands work.
16. Ensure timezone calculations are DST-aware.
17. Ensure ambiguous locations are handled safely.
18. Ensure the README accurately describes the finished project.
19. Leave the project in a runnable, production-ready state.

Do not merely tell me what code I should write.

**Actually create and modify the project files.**

At the end, provide a concise summary containing:

* What was implemented
* Project structure
* Dependencies added
* Environment variables required
* Commands available
* How to run locally
* How to deploy
* Any remaining limitations or decisions that require human input

The finished application should be ready for me to install the dependencies, provide the Discord credentials, deploy the global slash commands, and run the bot.
