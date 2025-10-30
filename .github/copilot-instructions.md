# Copilot Instructions for Amano Discord Bot

## Architecture Overview

This is a Discord.js bot with a service-oriented architecture using dependency injection via a singleton `ServiceContainer` (`src/services/serviceContainer.js`). Services are registered at startup in `src/index.js` and resolved throughout the application.

**Core Components:**
- **Commands** (`src/commands/`): Slash commands following discord.js v14 structure with `data` and `execute` exports
- **Events** (`src/events/`): Discord event handlers (`messageCreate`, `ready`) with `name` and `execute` exports
- **Services** (`src/services/`): Business logic layer (ChannelService, MessageService, UserService) injected via serviceContainer
- **Models** (`src/models/`): Sequelize ORM models exported as loader functions that accept a Sequelize instance
- **Loaders** (`src/util/loaders.js`): Dynamic structure loaders with Zod-based validation predicates

**Data Flow:**
1. Discord events trigger handlers in `src/events/`
2. Handlers call `getMessageReply()` from `src/util/util.js` which orchestrates logic
3. Services accessed via `serviceContainer.resolve()` handle persistence and OpenAI interactions
4. Message tracking uses mutex locks (`src/util/mutex.js`) for thread-safe writes to in-memory LRU cache

## Database Configuration

Environment-based setup in `src/db/db.js`:
- **Development**: SQLite in-memory (auto-recreated on restart, `sync({ force: true })`)
- **Production**: MySQL/PostgreSQL configured via `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_DIALECT` env vars

Models sync automatically in `src/db/dbInit.js` - no migrations in development.

## Key Patterns

### Service Container Pattern
```javascript
// Register at startup (src/index.js)
serviceContainer.register("channelService", new ChannelService(sequelize.models.Channel));

// Resolve in commands/handlers
const channelService = serviceContainer.resolve("channelService");
```

### Command Structure
Commands must export `{ data, execute }` matching the predicate in `src/commands/index.js`. See `src/commands/chance.js` for permission checking pattern.

### Event Structure
Events must export `{ name, execute }` (optional `once: true`). The `InteractionCreate` event is auto-generated in `src/util/registerEvents.js` to route slash commands.

### Model Loaders
Models export a function accepting Sequelize instance (see `src/models/channel.js`). This pattern allows models to reference each other via `sequelize.models.*` after all are loaded.

### Message Reply Logic
`src/util/util.js` contains the decision tree:
1. Check for swear words → probabilistic reply with quote/image
2. Check if message mentions "ernest" → AI-powered reply using OpenAI
3. AI replies include conversation history from `MessageService` (LRU-cached, summarized at limit)

## Development Workflow

**Setup:**
```bash
npm install
cp .env.example .env  # Add DISCORD_TOKEN, APPLICATION_ID, OPENAI_API_KEY
npm run deploy        # Register slash commands with Discord
npm start             # Run bot
```

**Code Quality:**
- ESLint: Uses `eslint-config-neon` preset (Node.js + Prettier)
- Disabled JSDoc rules: `valid-types`, `check-tag-names`, `no-undefined-types` (see `.eslintrc.json`)
- Pre-commit: Husky + lint-staged runs `eslint --fix` and `prettier --write` on staged `.js` files
- Run manually: `npm run lint:fix` and `npm run format`

**Commit Messages:**
Follow Conventional Commits (enforced by commitlint): `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- Example: `feat(commands): add new quote randomizer command`

**Command Documentation:**
Run `npm run docs:commands` to regenerate the commands table in `README.md` (updates between `<!-- BEGIN COMMANDS SECTION -->` markers).

## Critical Implementation Details

### OpenAI Integration
- Model: `gpt-4o-mini` with `response_format: { type: "json_object" }`
- System prompt enforces Ernest Amano character with mood-based responses
- Message history capped at `MAX_MESSAGE_LIMIT` (default 20, configurable via env)
- When limit reached, `MessageService` auto-generates summary and clears history

### Mutex for Message Tracking
`MessageService.addMessages()` uses a custom `Mutex` class to prevent race conditions when updating conversation history. Always lock before writes, unlock in finally block.

### Swear Detection
`hasSwear()` in `src/util/util.js` uses regex patterns from `src/swears.js`. URLs are explicitly excluded from swear checking. Reply chance per channel stored in DB via `ChannelService`.

### Structure Loading
`loadStructures()` recursively imports files, validates with predicates (Zod schemas), skips `index.js`. Commands/events/models all use this pattern with type-specific predicates.

## Environment Variables Reference

Required:
- `DISCORD_TOKEN`: Bot token from Discord Developer Portal
- `APPLICATION_ID`: Discord application ID for command registration
- `OPENAI_API_KEY`: OpenAI API key for AI replies

Optional:
- `MAX_MESSAGE_LIMIT`: Messages before summarization (default: 20)
- `NODE_ENV`: Set to `production` to use external DB
- Production DB: `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_DIALECT`

## Common Tasks

**Add a new command:**
1. Create file in `src/commands/` exporting `{ data, execute }`
2. Run `npm run deploy` to register with Discord
3. Run `npm run docs:commands` to update README

**Add a service:**
1. Create class in `src/services/`
2. Register in `src/index.js`: `serviceContainer.register("name", instance)`
3. Resolve where needed: `serviceContainer.resolve("name")`

**Modify AI behavior:**
Edit system prompt in `getAIReply()` in `src/util/util.js`. Mood mapping to image sets is at bottom of function.
