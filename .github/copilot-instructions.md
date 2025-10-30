# Copilot instructions for this repo

Purpose: Help AI agents contribute productively to this Node.js Discord bot (ESM, discord.js v14, Sequelize, OpenAI) with minimal context hunting.

## Architecture and flow
- Entry: `src/index.js` initializes DB (`initDB` → `loadModels` → `sequelize.sync`), registers services in `services/serviceContainer.js`, creates Discord client with intents, loads `events/` and `commands/` via `util/loaders.js`, wires them in `util/registerEvents.js`, then logs in.
- Commands: Each file in `src/commands/**` exports default `{ data, execute }`. They’re validated by `commands/index.js` (zod). Loaded into a `Map` keyed by `data.name`. Slash commands are dispatched by an auto-wired `InteractionCreate` handler in `registerEvents.js`.
- Events: Each file in `src/events/**` exports default `{ name, once?, execute }` validated by `events/index.js` (zod). `messageCreate` delegates to the `getMessageReply` function in `src/util/util.js`.
- Messaging logic: `getMessageReply()` replies if message includes "ernest" (AI path) or (if a swear is detected) passes a per-channel chance gate from `ChannelService`.
- AI replies: `getAIReply` (in `src/util/util.js`) uses OpenAI chat (model: `gpt-4o-mini`) to return JSON `{ mood, content }`, chooses an Amano image by `mood`, and optionally persists history via `MessageService`.
- Summaries: `MessageService` tracks per-guild history with `QuickLRU` + `Mutex`; when `MAX_MESSAGE_LIMIT` is reached, it summarizes with `gpt-4o`, stores `Message` (fields: `guildId`, `content` summary, `mimic`).
- Persistence: `src/db/db.js` uses SQLite in-memory when `NODE_ENV != 'production'`; in production reads `DB_*` env vars. `dbInit.js` loads `models/**` (ModelLoader pattern) and syncs; dev uses `force: true` (drops schema).

## Conventions and patterns
- ESM only (`type: module`). Dynamic loading uses `new URL('path/', import.meta.url)` and default exports only; `loaders.js` ignores `index.js` in folders.
- Schema guards: zod schemas in `commands/index.js` and `events/index.js` validate shapes at load time (fail fast).
- DI: Register shared instances in `serviceContainer` in `src/index.js` (e.g., `openAI`, `channelService`, `messageService`, `userService`). Resolve via `serviceContainer.resolve(name)` inside commands/util.
- Config: `src/config.js` loads `.env` from repo root and exposes constants (e.g., `MAX_MESSAGE_LIMIT`, `MESSAGE_REPLY_CHANCE`).
- Content: `swears.js` holds regex patterns; `quotes.js` and `images.js` supply reply text/assets.

## Workflows you’ll actually run
- Local dev: `npm install` → create `.env` (see README) → `npm run deploy` (register slash commands) → `npm start` (loads env via `--require dotenv/config`).
- Lint/format: `npm run lint`, `npm run format` (`eslint-config-neon` + Prettier). Tests are placeholder.
- Docs sync: `npm run docs:commands` regenerates the Commands table in `README.md` from files in `src/commands/**`.
- CI/CD: Commit messages must follow Conventional Commits (`commitlint`). On push to `main`, `semantic-release` creates releases; then the pipeline deploys slash commands, updates `README.md`, builds and pushes Docker image, and can deploy to a VPS via SSH. Secrets needed: `DISCORD_TOKEN`, `APPLICATION_ID`, Docker Hub creds, VPS SSH.

## How to extend safely (examples in repo)
- Add a command: Create `src/commands/mycmd.js` default export with `{ data, execute }` (see `ping.js`, `chance.js`). Run `npm run deploy` to register. CI also deploys on release.
- Add an event: Create `src/events/myEvent.js` default export `{ name: Events.X, once?, execute }` (see `ready.js`, `messageCreate.js`). No manual wiring.
- Add a model: Create `src/models/foo.js` default export `(sequelize) => sequelize.define(...)` (see `channel.js`, `user.js`). `initDB` will load and sync it.
- Use services: Resolve with `serviceContainer.resolve('channelService'|'userService'|'messageService'|'openAI')`. Don’t instantiate new clients in handlers.

## Gotchas and tips
- Dev DB is ephemeral (SQLite in-memory + `force: true`); don’t expect persistence between runs.
- `messageCreate` ignores bot authors and wraps handler errors to avoid crashing the client.
- AI contract: `getAIReply` expects JSON with `mood` and `content`; keep responses under 1500 chars and prefix with “Now, now”/“There, there, now” (see system prompt).
- Channel reply chance is 0–100 and user-tracking is opt-in via `/track`. Chance-gated replies only trigger when `hasSwear(content)` is true.
- When blocking operations are possible, defer interactions (`interaction.deferReply`) as done in `meme.js`, `chance.js`, `track.js`.

Key files to skim: `src/index.js`, `src/util/{loaders.js,registerEvents.js,util.js}`, `src/services/**`, `src/models/**`, `src/commands/**`, `.github/workflows/ci-cd.yml`, `src/util/deploy.js`.
