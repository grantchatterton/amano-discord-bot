# Amano Discord Bot

[![Invite Amano](https://img.shields.io/badge/Invite%20To%20Your%20Server-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/oauth2/authorize?client_id=1315330069287276576&permissions=117760&integration_type=0&scope=bot+applications.commands)

Amano is a Discord bot based off the character Ernest Amano from Ace Attorney Investigations: Miles Edgeworth. It is used for automated replies and a set of fun utility commands. It was built with Node.js, discord.js, and Sequelize ORM. The bot uses SQLite (in-memory) for development and supports MySQL or PostgreSQL for production. The bot can run locally, be deployed in Docker, or run in other Node.js-compatible environments.

I plan on updating this application in the future to support customization for who/what the bot should behave as.

## Features

- Automatic replies to messages containing configured swear words with a configurable chance
- AI-powered responses when messages mention "ernest" (uses OpenAI if configured, otherwise uses fallback generic replies)
- Slash commands (see Commands below)
- Message tracking system for personalized AI interactions (opt-in)

## Commands

<!-- BEGIN COMMANDS SECTION -->

| Name    | Description                                                              |
| ------- | ------------------------------------------------------------------------ |
| /chance | Set the chance of replying to a message containing a swear for a channel |
| /foo    | Replies with bar                                                         |
| /meme   | Send a random meme                                                       |
| /ping   | Pong!                                                                    |
| /roll   | Roll one or more dice                                                    |
| /track  | Allows users to opt in/out of having their messages tracked              |

<!-- END COMMANDS SECTION -->

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm (or yarn)
- A Discord application and bot token (from the Discord Developer Portal)
- OpenAI API key (optional, for AI-powered responses)

## Obtaining a Discord Bot Token

To run Amano, you'll need to create a Discord application and bot through the Discord Developer Portal. Follow these steps to obtain your bot token and application ID:

**1. Log in to the Discord Developer Portal**
   - Visit [https://discord.com/developers/applications](https://discord.com/developers/applications)
   - Log in with your Discord account
   - If you don't have a Discord account, you'll need to create one first at [https://discord.com](https://discord.com)

**2. Create a new application**
   - Click the "New Application" button in the top-right corner
   - Enter a name for your application (e.g., "Amano Bot" or "My Ernest Bot")
   - Read and accept Discord's Terms of Service and Developer Policy
   - Click "Create"

**3. Copy your Application ID**
   - On the "General Information" page, you'll see your "Application ID" (also called Client ID)
   - Click "Copy" to copy this ID — you'll need it for the `APPLICATION_ID` environment variable
   - Keep this page open as you'll need to come back to it

**4. Create a bot**
   - In the left sidebar, click on "Bot"
   - Click the "Add Bot" button (or "Reset Token" if a bot already exists)
   - Confirm by clicking "Yes, do it!" when prompted

**5. Configure bot settings**
   - Under "Privileged Gateway Intents", enable the following:
     - **Message Content Intent** (required for the bot to read message content)
   - Save changes if prompted

**6. Retrieve your bot token**
   - In the "Bot" section, find the "TOKEN" section
   - Click "Reset Token" (if this is your first time, it may say "Copy" instead)
   - Click "Yes, do it!" to confirm if prompted
   - Click "Copy" to copy your bot token
   - **Important**: Store this token securely — you won't be able to see it again
   - If you lose the token, you'll need to reset it and update your environment configuration

**7. Add the token and Application ID to your environment configuration**
   - Add both values to your `.env` file (see Quick start below)
   - Never commit bot tokens to version control or share them publicly
   - Anyone with your bot token can control your bot

**Security Notes**:
- Keep your bot token secret and secure — treat it like a password
- If your token is accidentally exposed (e.g., committed to a public repository), reset it immediately in the Developer Portal
- Discord will automatically reset your token if they detect it has been compromised

## Obtaining an OpenAI API Key (Optional)

To use Amano's AI-powered features, you'll need an OpenAI API key. If you don't configure an OpenAI API key, the bot will still work but will use fallback generic replies instead of AI-generated responses when messages mention "ernest". Follow these steps to obtain one:

**1. Create an OpenAI account**
   - Visit [https://platform.openai.com/signup](https://platform.openai.com/signup)
   - Sign up for a new account or log in if you already have one
   - Note: You may need to verify your email address and provide a phone number

**2. Navigate to the API keys section**
   - Once logged in, go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Or click on your profile icon in the top-right corner and select "API keys" from the menu

**3. Generate a new API key**
   - Click the "+ Create new secret key" button
   - Give your key a descriptive name (e.g., "Amano Discord Bot")
   - Click "Create secret key"
   - **Important**: Copy the key immediately and store it securely — you won't be able to see it again
   - If you lose the key, you'll need to generate a new one

**4. Add the key to your environment configuration**
   - Add the key to your `.env` file (see Quick start below)
   - Never commit API keys to version control or share them publicly

**Note**: OpenAI API usage is billed based on consumption. Make sure to review [OpenAI's pricing](https://openai.com/pricing) and set up billing limits in your account settings to avoid unexpected charges.

## Quick start — run locally

**1. Install dependencies**

```bash
npm install
```

**2. Create environment file**

The app loads environment variables from a `.env` file in the project root. You can copy the example template to get started:

```bash
cp .env.example .env
```

Then edit `.env` to include your credentials:

```
DISCORD_TOKEN=your_bot_token_here
APPLICATION_ID=your_application_id_here
# Optional
OPENAI_API_KEY=your_openai_key_here
MAX_MESSAGE_LIMIT=20
NODE_ENV=development
```

Notes:

- `DISCORD_TOKEN` is required for the bot to login.
- `APPLICATION_ID` is used when registering slash commands (`npm run deploy`).
- `OPENAI_API_KEY` is optional. If not provided, the bot will use fallback generic replies instead of AI-generated responses.
- When `NODE_ENV` is not `production`, the app uses an in-memory SQLite database for development convenience.
- For production, set `NODE_ENV=production` and configure database connection using `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_DIALECT` environment variables (see Environment variables reference below).

**3. Register slash commands (optional but recommended before first run)**

```bash
npm run deploy
```

This uses `src/util/deploy.js` and requires `DISCORD_TOKEN` and `APPLICATION_ID` in your environment.

**4. Start the bot**

```bash
npm start
```

You should see the bot initialize and log in using your provided token.

## Docker

The repository contains a `Dockerfile` and `compose.yaml` for containerized runs.

Before running with Docker, create a `.env` file in the project root with your configuration (you can copy `.env.example` as a starting point).

Build and run using Docker Compose:

```bash
# from project root
docker compose up --build
```

Note: The `compose.yaml` loads environment variables from the `.env` file in the project root. Make sure to create this file with your configuration before running.

### Run with Docker (without docker-compose)

Build the image from the project root:

```bash
docker build -t amano-discord-bot:latest .
```

Run the container using an .env file (recommended):

**1. Create a `.env` file in the project root with the required environment variables (e.g. `DISCORD_TOKEN=...` and any other variables the bot needs).**

**2. Start the container:**

```bash
docker run --env-file .env \
  --name amano-discord-bot \
  --restart unless-stopped \
  -d amano-discord-bot:latest
```

Or run by passing environment variables directly:

```bash
docker run -e DISCORD_TOKEN=your_token \
  -e APPLICATION_ID=your_application_id \
  -e OPENAI_API_KEY=your_openai_key \  # Optional, can be omitted
  -e NODE_ENV=production \
  --name amano-discord-bot \
  --restart unless-stopped \
  -d amano-discord-bot:latest
```

Mount local data if the bot needs persistent storage or config files:

```bash
docker run --env-file .env \
  -v "$(pwd)/data":/app/data \
  --name amano-discord-bot \
  --restart unless-stopped \
  -d amano-discord-bot:latest
```

Notes

- You normally do not need to expose ports for a Discord bot unless it runs a web/health endpoint — if so, add `-p <host_port>:<container_port>`.
- View logs: `docker logs -f amano-discord-bot`
- Enter a running container shell: `docker exec -it amano-discord-bot sh` (or `bash`)
- Stop & remove: `docker stop amano-discord-bot && docker rm amano-discord-bot`

## Environment variables reference

- **DISCORD_TOKEN** — (required) the bot token from Discord Developer Portal
- **APPLICATION_ID** — (required for registering commands) your application's client id
- **OPENAI_API_KEY** — (optional) OpenAI API key for AI-generated replies; if not provided, the bot will use fallback generic replies
- **NODE_ENV** — (optional) set to `production` in production; default is `development`
- **MAX_MESSAGE_LIMIT** — (optional) maximum number of messages to track per guild for AI context; default is 20
- **DB_NAME** — (production only) database name
- **DB_USER** — (production only) database user
- **DB_PASSWORD** — (production only) database password
- **DB_HOST** — (production only) database host
- **DB_DIALECT** — (production only) database dialect (e.g., `mysql` or `postgres`)

## Registering commands

To push the commands defined in `src/commands` to Discord, run:

```bash
npm run deploy
```

This uses `src/util/deploy.js` and requires `DISCORD_TOKEN` and `APPLICATION_ID` in your environment.

## Inviting the bot to a Discord server (self hosted)

**1. Get your Application (Client) ID:**
   - From the Discord Developer Portal (Applications → your app) or from your local `.env` file as `APPLICATION_ID`.

**2. Use the OAuth2 URL generator (recommended):**
   - In the Developer Portal go to OAuth2 → URL Generator.
   - Select the scopes: `bot` and `applications.commands` (if you want slash commands).
   - Under "Bot Permissions" select the permissions your bot needs and copy the generated URL.
   - Paste the URL in your browser, choose the server, and authorize the bot (you must have Manage Server or Administrator on the target server).

**3. Or build the invite URL manually:**
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

## Contributing

- Open an issue or PR. Keep changes small and focused.
