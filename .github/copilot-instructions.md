# Amano Discord Bot - AI Coding Agent Instructions

## Project Overview

Amano is a Discord.js v14 bot that roleplay's as Ernest Amano from Ace Attorney, responding to swears and "ernest" mentions with AI-generated replies. Built with Node.js ESM, Sequelize ORM, and OpenAI integration.

## Architecture Patterns

### Service Container Pattern
All services use a singleton container (`src/services/serviceContainer.js`). Register in `src/index.js` at startup:

```javascript
serviceContainer.register("openAI", new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
serviceContainer.register("channelService", new ChannelService(sequelize.models.Channel));
```

Resolve anywhere via `serviceContainer.resolve("serviceName")`. Never instantiate services directly.

### Dynamic Module Loading
Commands and events auto-load from directories using `src/util/loaders.js`:

- **Commands**: Export default object with `data` (Discord command JSON) and `execute(interaction)` function
- **Events**: Export default object with `name` (Discord.js Events enum), optional `once` boolean, and `execute(...args)` function  
- **Models**: Export default function that receives sequelize instance and returns model definition

All must pass Zod validation predicates (`src/commands/index.js`, `src/events/index.js`, `src/models/index.js`). Files named `index.js` are skipped during loading.

### Database Management

**Environment-based DB config** (`src/db/db.js`):
- Development: In-memory SQLite (`sqlite::memory:`)
- Production: MySQL/PostgreSQL via `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_DIALECT` env vars

**Schema sync**: `force: true` in dev (drops/recreates tables on restart), standard sync in production. Models auto-register from `src/models/` before sync.

## Critical Workflows

### Adding New Commands

1. Create `src/commands/your-command.js`:

```javascript
export default {
  data: {
    name: "commandname",
    description: "Description here",
    options: [/* slash command options */]
  },
  async execute(interaction) {
    // Implementation
  }
}
```

2. Run `npm run deploy` to register with Discord API (requires `DISCORD_TOKEN` and `APPLICATION_ID`)
3. Command auto-loads on next bot restart

### Message Reply Logic

Located in `src/util/util.js` → `getMessageReply()`:

1. **"ernest" keyword**: Always triggers AI reply via OpenAI (see `getAIReply()`)
2. **Swear detection**: Checks against regex patterns in `src/swears.js`, then probability-based reply using channel's `replyChance` (configurable via `/chance` command, stored in `Channel` model)
3. **Generic fallback**: Returns random quote + image from `src/quotes.js` and `src/images.js`

AI replies use **GPT-5** for message summaries and **GPT-5-mini** for responses, with mood-based image selection (normal/placating/sad/angry/sweating).

### Message History Tracking

**Opt-in system** (`User.trackMessages` boolean):
- Users control via `/track` command
- When enabled, `MessageService` stores user/assistant messages in `Message` model
- Uses `Mutex` lock to prevent race conditions during concurrent message adds
- Implements `QuickLRU` cache (500 item limit) for guild message collections
- Message limit per guild: `MAX_MESSAGE_LIMIT` env var (default 20)

Summaries generated via OpenAI before adding to prevent context length issues.

## Project-Specific Conventions

### Environment Configuration
Uses **dotenv with NODE_ENV suffix**: Loads `.env.${NODE_ENV}` (default: `.env.development`). Never hardcode `.env` - always use environment-specific files.

### Event Registration
`registerEvents()` in `src/util/registerEvents.js` programmatically creates `InteractionCreate` event handler for slash commands. Don't manually create this event file.

### Imports & ESM
**ES Modules only** (`"type": "module"` in package.json):
- Use `import.meta.url` for file-relative paths
- Dynamic imports: `(await import(path)).default`
- Always export default for commands/events/models

### Error Handling
Console.error for debugging, graceful fallbacks (e.g., `getGenericMessageReply()` when AI fails). No try-catch in event handlers - let Discord.js handle errors.

## Key Commands

```bash
npm start              # Start bot (loads .env.development by default)
npm run deploy         # Register slash commands with Discord
npm run docs:commands  # Generate command documentation table for README
npm run lint          # ESLint check (eslint-config-neon)
npm run format        # Prettier format all files
```

**Docker**: `docker compose up --build` (requires `.env` with production config)

## Integration Points

- **Discord.js v14**: Uses `GatewayIntentBits.MessageContent` for message scanning
- **OpenAI API**: Two models - GPT-5 (summaries), GPT-5-mini (responses). JSON schema responses enforced via `response_format`
- **Sequelize**: Models in `src/models/`, associations not currently used. SQLite dev, configurable DB production
- **Service Communication**: All cross-service calls via `serviceContainer.resolve()` - no direct imports of service instances

## File Organization

- `src/commands/` - Slash command definitions (auto-loaded)
- `src/events/` - Discord event handlers (auto-loaded)  
- `src/services/` - Business logic (ChannelService, MessageService, UserService)
- `src/models/` - Sequelize models (auto-loaded)
- `src/util/` - Helpers, loaders, deploy script
- `src/config.js` - Environment loading, constants (MESSAGE_REPLY_CHANCE, MAX_MESSAGE_LIMIT)

## Common Gotchas

- **Command registration**: Changes to `data` require `npm run deploy` - not automatic
- **Service resolution**: Services must be registered before `client.login()` in `src/index.js`
- **Model loading**: Models must export function, not class. Called during `initDB()`
- **Message tracking**: Only tracks when user opts in AND AI reply successful - check both conditions
- **Sequelize sync**: Dev mode drops tables - don't rely on persistent data in development
