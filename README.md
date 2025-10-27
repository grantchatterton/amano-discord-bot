# Amano Discord Bot

Amano is a Discord bot used for automated replies and a set of fun utility commands. It was built with Node.js, discord.js, and Sequelize (SQLite in development). The bot can run locally, be deployed with Docker, and register application commands with Discord.

## Features

- Automatic replies to messages containing configured swear words with a configurable chance
- Slash commands (see `src/commands/`)
- OpenAI integration for advanced replies (requires `OPENAI_API_KEY`)

## Prerequisites

- Node.js 18+ (recommended)
- npm (or yarn)
- A Discord application and bot token (from the Discord Developer Portal)
- OpenAI API key

## Quick start — run locally

1. Install dependencies

```bash
npm install
```

2. Create environment file

The app loads environment variables from `.env.${NODE_ENV}` — by default `NODE_ENV` is `development`, so create a `.env.development` file in the project root.

At minimum include:

```
DISCORD_TOKEN=your_bot_token_here
APPLICATION_ID=your_application_id_here
OPENAI_API_KEY=your_openai_key_here
# Optional
MAX_MESSAGE_LIMIT=100
NODE_ENV=development
```

Notes:

- `DISCORD_TOKEN` is required for the bot to login.
- `APPLICATION_ID` is used when registering slash commands (`npm run deploy`).
- When `NODE_ENV` is not `production`, the app uses an in-memory SQLite DB for dev convenience.

3. Register slash commands (optional but recommended before first run)

```bash
npm run deploy
```

4. Start the bot

```bash
npm start
```

You should see the bot initialize and log in using your provided token.

## Docker

The repository contains a `Dockerfile` and `compose.yaml` for containerized runs.

Build and run using Docker Compose:

```bash
# from project root
docker compose up --build
```

When running in Docker you should supply environment variables via a `.env` file or the compose file.

## Environment variables reference

- DISCORD_TOKEN — (required) the bot token from Discord Developer Portal
- APPLICATION_ID — (required for registering commands) your application's client id
- OPENAI_API_KEY — (required) OpenAI API key if OpenAI features are desired
- NODE_ENV — (optional) set to `production` in production; default is `development`
- MAX_MESSAGE_LIMIT — (optional) used by message service (integer)
- DB\_\* variables — only required if you run with a production database (see `src/db/db.js`)

## Registering commands

To push the commands defined in `src/commands` to Discord, run:

```bash
npm run deploy
```

This uses `src/util/deploy.js` and requires `DISCORD_TOKEN` and `APPLICATION_ID` in your environment.

## Inviting the bot to a Discord server

1. Get your Application (Client) ID:
   - From the Discord Developer Portal (Applications → your app) or from your local `.env.*` as `APPLICATION_ID`.

2. Use the OAuth2 URL generator (recommended):
   - In the Developer Portal go to OAuth2 → URL Generator.
   - Select the scopes: `bot` and `applications.commands` (if you want slash commands).
   - Under "Bot Permissions" select the permissions your bot needs and copy the generated URL.
   - Paste the URL in your browser, choose the server, and authorize the bot (you must have Manage Server or Administrator on the target server).

3. Or build the invite URL manually:
   - Replace APPLICATION_ID and PERMISSIONS_INTEGER in the template below and open it in a browser:
     ```
     https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&permissions=PERMISSIONS_INTEGER&scope=bot%20applications.commands
     ```
   - Example (Administrator permission — not recommended for production unless required):
     ```
     https://discord.com/oauth2/authorize?client_id=APPLICATION_ID&permissions=8&scope=bot%20applications.commands
     ```

Notes:

- Use the URL generator to get the correct permissions integer for specific permissions instead of using broad permissions like Administrator.
- After inviting the bot, register commands with `npm run deploy` (see "Registering commands" above) if needed.

## Development notes

- The bot uses an in-memory SQLite database when `NODE_ENV !== 'production'`. For production set DB\_\* environment variables and `NODE_ENV=production`.
- Commands live in `src/commands/` and events in `src/events/`.

## Contributing

- Open an issue or PR. Keep changes small and focused.
