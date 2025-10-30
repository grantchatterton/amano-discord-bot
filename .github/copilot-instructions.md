# Amano Discord Bot - AI Coding Agent Instructions

## Project Overview
Discord.js v14 bot (~1,216 LOC) that roleplays as Ernest Amano, responding to swears/"ernest" with AI replies. Node.js ESM, Sequelize ORM, OpenAI, SQLite dev/MySQL+Postgres prod. 5 slash commands, 2 events, 3 models.

## Quick Start & Build Commands

### Setup (Always Required First)
```bash
npm install              # ~60s, always run first after checkout
cp .env.example .env     # Then edit with DISCORD_TOKEN, APPLICATION_ID, OPENAI_API_KEY
```

### Validation Commands (Run in Order)
```bash
npm run lint            # ESLint check (~1-2s), must pass
npm run format:check    # Prettier check (~3-5s), must pass
npm test               # Currently no-op, always succeeds
```

### Auto-Fix Commands
```bash
npm run lint:fix        # Auto-fix lint errors
npm run format          # Auto-format all files
```

### Runtime Commands (Require Credentials)
```bash
npm start                  # Start bot (loads .env, drops/recreates DB tables in dev)
npm run deploy             # Register commands with Discord (needs DISCORD_TOKEN, APPLICATION_ID)
npm run docs:commands      # Update README command table (~1s, no credentials needed)
```

### Docker
```bash
docker compose up --build  # Requires .env file in project root
```

## Known Issues & Workarounds

**Issue**: `npm install` shows EBADENGINE warnings for semantic-release packages  
**Fix**: Ignore - dev dependencies only, work fine with Node 20.x

**Issue**: SQLite deprecation warning `DeprecationWarning: The URL sqlite::memory: is invalid`  
**Fix**: Ignore - Sequelize/Node.js compatibility issue, database works correctly

**Issue**: `ENOTFOUND discord.com` on `npm start` or `npm run deploy`  
**Fix**: Normal without network - requires Discord API connectivity

**Issue**: No `.husky/` directory despite husky in package.json  
**Fix**: Local hooks not set up, CI handles all validation

## Architecture Patterns

### Service Container (src/services/serviceContainer.js)
All services use singleton DI container. Register in `src/index.js` at startup:
```javascript
serviceContainer.register("openAI", new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
serviceContainer.register("channelService", new ChannelService(sequelize.models.Channel));
```

**Critical**: Resolve services OUTSIDE try-catch to fail fast on config errors:
```javascript
const openAI = serviceContainer.resolve("openAI");  // Let this throw if misconfigured
try { await openAI.chat.completions.create(...); } catch (error) { /* handle runtime errors */ }
```

### Dynamic Module Loading (src/util/loaders.js)
Commands, events, models auto-load from directories. Must pass Zod validation. Files named `index.js` skipped.

- **Commands**: `export default { data: {...}, async execute(interaction) {...} }`
- **Events**: `export default { name: Events.X, async execute(...args) {...} }`  
- **Models**: `export default (sequelize) => sequelize.define(...)`

### Database
- **Dev**: In-memory SQLite, `force: true` sync (drops tables on restart)
- **Prod**: MySQL/Postgres via `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_DIALECT` env vars

## Critical Workflows

### Adding New Slash Commands
1. Create `src/commands/your-command.js` (see `src/commands/ping.js` for minimal example)
2. **Must run** `npm run deploy` to register with Discord (requires credentials)
3. **Should run** `npm run docs:commands` to update README
4. Command auto-loads on next restart, no other code changes needed

### Message Reply Logic (in src/util/util.js, function getMessageReply())
1. "ernest" keyword - Always AI reply via `getAIReply()` (OpenAI gpt-4o-mini, `json_object` format, `max_tokens: 500`)
2. Swear word - Probability-based reply (channel's `replyChance`, configurable via `/chance` command)
3. Fallback - Random quote+image from `src/quotes.js` + `src/images.js`

**Performance**: `getAIReply()` parallelizes data fetching before OpenAI call using `Promise.allSettled([messageService.getMessages(...), userService.getUser(...)])`

### Message History Tracking
- Opt-in via `/track` command (stores in `User.trackMessages` boolean)
- `MessageService` uses `QuickLRU` cache (500 guilds), `Mutex` lock for writes only
- Max messages per guild: `MAX_MESSAGE_LIMIT` env var (default 20)
- Dev mode: Data lost on restart (in-memory DB)

## Project Structure

```
src/
├── index.js              # Entry point, service registration, bot initialization
├── config.js             # Env loading (dotenv), exports MESSAGE_REPLY_CHANCE, MAX_MESSAGE_LIMIT
├── commands/             # Slash commands (auto-loaded): ping, roll, meme, chance, track
├── events/               # Discord events (auto-loaded): ready, messageCreate
├── models/               # Sequelize models (auto-loaded): channel, message, user
├── services/             # Business logic: serviceContainer, channelService, messageService, userService
├── db/                   # Database: db.js (Sequelize instance), dbInit.js (model loading & sync)
├── util/                 # Helpers: loaders, registerEvents, deploy, generateCmdDocs, mutex, util (core bot logic)
├── swears.js, quotes.js, images.js  # Bot data

Root config files:
├── .eslintrc.json        # ESLint (neon preset)
├── .prettierrc.json      # Prettier (tabs, 120 width, double quotes, trailing commas)
├── .releaserc.json       # Semantic-release (changelog, git, github plugins)
├── commitlint.config.js  # Conventional Commits validation
└── .github/workflows/ci-cd.yml  # Main CI/CD pipeline
```

## CI/CD Pipeline (.github/workflows/ci-cd.yml)

Triggers on push/PR to main (only `src/**` and `tests/**` paths):

**Job Dependencies** (jobs run in sequence as listed):
1. **commit-lint** (always runs first) - Validates Conventional Commits format
2. **lint-and-format** (after commit-lint, PR only) - Runs `npm run lint` and `npm run format:check`
3. **test** (after lint-and-format) - Runs `npm test` (currently no-op)
4. **release** (after commit-lint + test, push to main only) - Semantic-release, updates version, creates GitHub release
5. **deploy-discord-commands** (after release, if new release published) - `npm run deploy`, updates README, commits back
6. **deploy-docker** (after release, if new release published) - Multi-platform build (amd64/arm64), push to Docker Hub
7. **deploy-production** (after deploy-docker) - SSH to VPS, `docker compose down/up`

**Key behaviors**: lint-and-format only runs on PRs. Release jobs (4-7) only run on main branch pushes after successful commit-lint and test jobs.

**Local validation before commit**:
```bash
npm run lint && npm run format:check && npm test
git log -1 --pretty=%B | npx commitlint  # Validate commit message
```

## Commit Message Format
Use Conventional Commits: `type(scope): description`

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Examples:
- `feat(commands): add new roll command`
- `fix(util): correct swear detection regex`
- `docs(README): update installation steps`

## Key Dependencies
- **discord.js** v14.16.0 (requires "Message Content Intent" in Discord Dev Portal)
- **openai** v5.22.0 (gpt-4o-mini for responses, gpt-4o for summaries)
- **sequelize** v6.37.7 + sqlite3 v5.1.7 (dev) + mysql2 v3.15.0 (prod option)
- **dotenv** v16.6.1 (loaded via `node --require dotenv/config` in scripts)
- **quick-lru** v7.3.0 (message history cache)
- **zod** v3.23.8 (module validation)

## Environment Variables
Required:
- `DISCORD_TOKEN` - Bot token from Discord Developer Portal
- `APPLICATION_ID` - Application client ID (for command deployment)
- `OPENAI_API_KEY` - OpenAI API key

Optional:
- `NODE_ENV` - "development" (default) uses SQLite in-memory, "production" requires DB config
- `MAX_MESSAGE_LIMIT` - Max messages per guild (default 20)
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_DIALECT` - Production database config

## Common Gotchas

- **Command changes**: Modify `data` in command file → **must** `npm run deploy` to register
- **Service resolution**: Resolve services before try-catch, not inside (fail fast on config errors)
- **Model exports**: Export function, not class: `export default (sequelize) => sequelize.define(...)`
- **Dev DB**: Drops tables on restart - don't rely on persistent data in development
- **InteractionCreate**: Auto-generated by `registerEvents()`, don't create manually
- **ES Modules**: Use `import.meta.url`, dynamic imports with `(await import(path)).default`
- **OpenAI format**: Use `json_object` not `json_schema` (faster), set `max_tokens` for speed

## Making Changes - Workflow

1. Make code changes
2. `npm run lint:fix && npm run format` (auto-fix)
3. `npm run docs:commands` (if commands changed)
4. Test manually if possible (requires credentials)
5. Commit with format: `type(scope): description`
6. For slash commands: `npm run deploy` (registers with Discord)

**Trust these instructions**: Check this doc before searching/grepping codebase. Use documented command sequences and workarounds. Only search if info incomplete or incorrect.
