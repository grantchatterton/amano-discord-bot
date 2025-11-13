# Copilot instructions for this repo

Purpose: Make AI agents productive here quickly. Prefer small, surgical changes that follow existing patterns. Verify locally where possible.

## Stack, runtime, and entrypoints
- Node.js 20+, ESM only (`"type": "module"`). Discord bot using `discord.js@14`, Sequelize ORM, optional OpenAI.
- Entrypoint: `src/index.js`. Env is loaded by `src/config.js` (dotenv from project root).
- Scripts (`package.json`): `start`, `deploy` (register slash cmds), `docs:commands` (README docs), `lint`, `format`.

## System architecture (how it boots)
1) `src/index.js`
   - `initDB()` → loads model loaders from `src/models/**` and `sequelize.sync()`.
   - Registers services in `src/services/serviceContainer.js`: `openAI`, `channelService`, `messageService`, `userService`.
   - Creates `discord.js` `Client` with DM/Guild/MessageContent intents and `Channel` partials.
   - Loads events and commands via `src/util/loaders.js` (dynamic import; skips any `index.js` files).
   - Wires events with `src/util/registerEvents.js` (adds a built-in `InteractionCreate` dispatcher for slash commands).
   - `client.login(DISCORD_TOKEN)` and graceful shutdown on SIGINT/SIGTERM.

## Dynamic loading & validation
- Loader (`src/util/loaders.js`) recursively walks directories and `import()`s defaults; validates shapes with Zod predicates:
  - Command (`src/commands/index.js`): default export `{ data, execute }` where `data` is REST-ready JSON.
  - Event (`src/events/index.js`): default export `{ name, execute, once? }`.
  - Model loader (`src/models/index.js`): default export `(sequelize) => Model`.
- If a file doesn’t match the schema, it’s ignored. Put shared helpers in separate modules or keep in-folder `index.js` (which the loader skips).

## Data model (Sequelize)
- `Channel`: `channelId` (unique), `replyChance` int 0–100 (default from `MESSAGE_REPLY_CHANCE` = 25). Per-channel reply probability.
- `User`: `userId` (unique), `trackMessages` boolean (default true). Controls whether we persist/summarize their conversations.
- `Message`: One row per guild (note: `guildId` is unique). Stores the latest summary in `content` and optional `mimic` style string.
- DB config in `src/db/db.js`: defaults to SQLite in-memory unless `DB_STORAGE` is set (e.g., `./data/dev.db`). `DB_FORCE_SYNC=true` will drop/recreate tables (don’t use in prod).

## Services (DI via `serviceContainer`)
- `ChannelService`: in-memory `Collection` cache around Channel model. `getChannelReplyChance()`/`setChannelReplyChance()` persist and cache.
- `UserService`: in-memory `Collection` cache around User model. `getUser(userId)` find-or-create.
- `MessageService`: conversation memory per guild using `QuickLRU(maxSize: 500)` and a custom `Mutex` for writes.
  - `getMessages(guildId)`: returns system-context + accumulated messages for OpenAI.
  - `addMessages(guildId, ...messages)`: enqueues writes; when count ≥ `MAX_MESSAGE_LIMIT` (default 20), summarize via OpenAI and upsert `Message` row.
  - Summarizer: `gpt-4o` JSON output with fields `{ content, mimic }`; cache holds `summary` and `mimic` and clears accumulated messages after success.

## Message-processing pipeline (why the bot replies)
- `events/messageCreate.js` → `util.getMessageReply(message)`:
  1) If the content contains "ernest": call `getAIReply()` (typing indicator), else continue.
  2) If the text contains a swear (regex set in `src/swears.js`), fetch channel reply chance (`ChannelService`). If RNG ≤ chance, return a generic reply.
- Generic reply (`util.getGenericMessageReply()`): picks a quote from `src/quotes.js` and an image from `src/images.js`, returns `{ content, files: [AttachmentBuilder(url)] }`.
- AI path (`util.getAIReply()`):
  - `openAI` optional; if not configured, falls back to generic reply. If configured, composes a system prompt to speak as Ernest Amano and requests JSON `{ mood, content }`.
  - Adds image attachments as `image_url` if the first attachment is an image.
  - On success: store messages in `MessageService` only if `user.trackMessages` is true; choose a mood-specific image set; return `{ content, files }`.

## Commands & events conventions
- Command modules default-export `{ data, execute }`. Keep `data` REST-ready; examples:
  - Simple: `src/commands/ping.js`.
  - With permissions + deferral: `src/commands/chance.js` (requires ManageChannels in target channel; uses `channel.permissionsFor(member)` and `interaction.deferReply()`).
  - External HTTP: `src/commands/meme.js` (axios JSON API), `src/commands/newsmax.js` (axios + cheerio + NodeCache TTL 900s).
- Events default-export `{ name: Events.X, execute, once? }`. All slash commands are dispatched by the built-in `InteractionCreate` handler in `src/util/registerEvents.js`.

## Environment & configuration
- `src/config.js` loads `.env` from project root and exports:
  - `MESSAGE_REPLY_CHANCE` (25), `MAX_MESSAGE_LIMIT` (from env or 20), `MESSAGE_REPLY_IMAGE` (unused constant image URL; generic replies use `images.js`).
- Required env: `DISCORD_TOKEN`. Needed for `npm run deploy`: `APPLICATION_ID`.
- Optional env: `OPENAI_API_KEY`, DB_* (dialect/host/port/name/user/password/storage), `DB_FORCE_SYNC`.

## Developer workflows
- Register slash commands globally after adding/editing commands: run `npm run deploy` (uses `src/util/deploy.js` and bulk-overwrites global commands via `@discordjs/core`).
- Regenerate README commands table: run `npm run docs:commands` (writes between `<!-- BEGIN/END COMMANDS SECTION -->`).
- Local run: `npm start` (dotenv auto-loaded via `--require dotenv/config`).
- Lint/format: `npm run lint` / `npm run lint:fix`, `npm run format` / `npm run format:check`.
- Docker: `docker compose up --build` (uses non-root user; production install with `npm ci --omit=dev`).

## Extension patterns (copy these)
- New command: add `src/commands/xyz.js` exporting `{ data, execute }`. Test locally, then `npm run deploy` and `npm run docs:commands`.
- New event: add `src/events/xyz.js` exporting `{ name, execute, once? }`. Auto-registered on boot.
- New model: add `src/models/xyz.js` default export `(sequelize) => Model`. Auto-loaded by `initDB()`.
- New service: create a class under `src/services`, then register it in `src/index.js` and resolve via `serviceContainer.resolve("name")`.
- Message behavior: prefer editing `getMessageReply` in `src/util/util.js` or the specific helpers used within to keep flow consistent.

## Integration boundaries & external calls
- OpenAI is optional: all AI features must gracefully fall back when `openAI` is `null`.
- HTTP: use `axios`. Cache when appropriate (e.g., `newsmax` uses `node-cache`). Avoid blocking the event loop.
- Discord: rely on the interaction dispatcher instead of attaching per-command listeners.

## Troubleshooting (fast checks)
- Commands not updating: ensure `APPLICATION_ID` and `DISCORD_TOKEN` are set; rerun `npm run deploy` and allow global propagation time (~1–5m).
- Bot not replying to swears: check channel `replyChance` (default 25) with `/chance`; verify `Message Content Intent` is enabled in Discord Dev Portal and bot has permissions.
- AI path silent/failing: ensure `OPENAI_API_KEY` is set; inspect console errors; attachments supported only if first attachment is an image.
- Lost data across restarts: by default DB is in-memory. Set `DB_STORAGE=./data/dev.db` (SQLite) or configure another dialect for persistence.
- Schema changes during dev: if needed, set `DB_FORCE_SYNC=true` to rebuild tables (destructive).

## Do/Don’t for agents
- Do: follow the loader shapes exactly; keep default exports; use `serviceContainer` instead of `new`ing services; prefer existing helpers.
- Do: defer replies for long-running commands; check permissions when touching channel settings.
- Don’t: add dynamic require/CommonJS; the project is ESM-only. Don’t break loader schemas; mis-shaped files are silently ignored.
- Don’t: assume OpenAI is present; always keep the no-AI path working.

Examples to copy
- Command (see `src/commands/ping.js`): `{ data: { name: "ping", description: "Pong!" }, execute(i){ return i.reply("Pong!"); } }`.
- Event (see `src/events/messageCreate.js`): `{ name: Events.MessageCreate, async execute(message) { /* ... */ } }`.

Keep outputs small and targeted when contributing changes. Reuse helpers in `src/util/util.js` and established patterns above.
