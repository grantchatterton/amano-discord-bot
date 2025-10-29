# Amano Discord Bot - AI Coding Agent Instructions

## Project Overview

Amano is a Discord.js v14 bot that roleplays as Ernest Amano from Ace Attorney, responding to swears and "ernest" mentions with AI-generated replies. Built with Node.js ESM, Sequelize ORM, and OpenAI integration.

## Architecture Patterns

### Service Container Pattern
All services use a singleton container (`src/services/serviceContainer.js`). Register in `src/index.js` at startup:

```javascript
serviceContainer.register("openAI", new OpenAI({ apiKey: process.env.OPENAI_API_KEY }));
serviceContainer.register("channelService", new ChannelService(sequelize.models.Channel));
```

**Critical**: Resolve services outside try-catch blocks to fail fast on configuration errors:
```javascript
// ✅ Correct - fails fast if service not registered
const openAI = serviceContainer.resolve("openAI");
try {
  await openAI.chat.completions.create(...);
} catch (error) { ... }

// ❌ Wrong - masks configuration bugs
try {
  const openAI = serviceContainer.resolve("openAI");
} catch (error) { ... }
```

### Dynamic Module Loading
Commands, events, and models auto-load from directories using `src/util/loaders.js`:

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

**Performance**: `getAIReply()` parallelizes data fetching before OpenAI call:
```javascript
// Fetch message history and user data in parallel FIRST
const [messagesResult, userResponse] = await Promise.allSettled([
  messageService.getMessages(message.guildId),
  userService.getUser(message.author.id)
]);
// THEN make OpenAI call
const aiResponse = await openAI.chat.completions.create({...});
```

AI replies use **gpt-4o-mini** with `json_object` format (faster than json_schema), mood-based image selection (normal/placating/sad/angry/sweating), and `max_tokens: 500` for speed optimization.

### Message History Tracking

**Opt-in system** (`User.trackMessages` boolean):
- Users control via `/track` command
- When enabled, `MessageService` stores user/assistant messages in `Message` model
- Uses `Mutex` lock **only for writes** (`addMessages`), reads are lock-free for performance
- Implements `QuickLRU` cache (500 item limit) for guild message collections
- Message limit per guild: `MAX_MESSAGE_LIMIT` env var (default 20, recommended 20-30)

**Race condition prevention**: `getMessageData()` returns **reference** (not copy) to cached data, so mutations within mutex lock are atomic. `saveSummary()` mutates the cached object in-place.

Summaries generated via OpenAI (gpt-4o-mini, `max_tokens: 300`) before adding to prevent context length issues. Summary includes `mimic` field for custom speech style instructions.

## Project-Specific Conventions

### Environment Configuration
Uses **dotenv with dual-file pattern**: Loads `.env` (base configuration, committed) first, then `.env.local` (local overrides, git-ignored) for secrets. Never commit sensitive data - always use `.env.local` for secrets in development.

### Event Registration
`registerEvents()` in `src/util/registerEvents.js` programmatically creates `InteractionCreate` event handler for slash commands. Don't manually create this event file.

### Imports & ESM
**ES Modules only** (`"type": "module"` in package.json):
- Use `import.meta.url` for file-relative paths
- Dynamic imports: `(await import(path)).default`
- Always export default for commands/events/models

### Error Handling
**Fail fast on configuration errors**, graceful degradation on runtime errors:
```javascript
// Service resolution - let it throw (configuration bug)
const service = serviceContainer.resolve("service");

try {
  // Runtime operations - catch and handle gracefully
  await service.operation();
} catch (error) {
  console.error(error);
  return getGenericMessageReply();
}
```

### Performance Logging
`getAIReply()` includes performance instrumentation with `performance.now()` timing data fetch, API calls, and JSON parsing. Check console for `[Performance]` logs.

## Key Commands

```bash
npm start              # Start bot (loads .env and .env.local)
npm run deploy         # Register slash commands with Discord
npm run docs:commands  # Generate command documentation table for README
npm run lint          # ESLint check (eslint-config-neon)
npm run format        # Prettier format all files
```

**Docker**: `docker compose up --build` (requires `.env` with production config)

## CI/CD & Release Management

### Automated Versioning with Semantic Release
- **Configuration**: `.releaserc.json` with plugins for changelog, git commits, GitHub releases
- **Commit conventions**: `feat:` (minor), `fix:` (patch), `BREAKING CHANGE:` (major)
- **Auto-updates**: `package.json`, `package-lock.json`, and `CHANGELOG.md` committed back to main
- **Workflow**: `.github/workflows/node-ci-cd.yml` runs semantic-release on main branch pushes

### GitHub Actions Workflows
1. **Node.js CI/CD**: Lint, format, commitlint, semantic-release with npm caching and concurrency groups
2. **Docker CI/CD**: Multi-platform builds (amd64/arm64) with layer caching, deploys to Docker Hub and production VPS
3. **Discord Command Deploy**: Detects command changes, runs `npm run deploy`, updates README docs

**Performance optimizations**: NPM caching (`cache: "npm"`), Docker buildx cache, concurrency groups to cancel redundant runs, shallow checkouts where possible.

## Integration Points

- **Discord.js v14**: Uses `GatewayIntentBits.MessageContent` for message scanning
- **OpenAI API**: gpt-4o-mini (responses) and gpt-4o (summaries). Uses `response_format: { type: "json_object" }` for speed (avoid json_schema)
- **Sequelize**: Models in `src/models/`, associations not currently used. SQLite dev, configurable DB production
- **Service Communication**: All cross-service calls via `serviceContainer.resolve()` - no direct imports of service instances

## File Organization

- `src/commands/` - Slash command definitions (auto-loaded)
- `src/events/` - Discord event handlers (auto-loaded)  
- `src/services/` - Business logic (ChannelService, MessageService, UserService)
- `src/models/` - Sequelize models (auto-loaded)
- `src/util/` - Helpers, loaders, deploy script
- `src/config.js` - Environment loading, constants (MESSAGE_REPLY_CHANCE, MAX_MESSAGE_LIMIT)
- `.github/workflows/` - CI/CD pipelines with caching and optimization
- `.releaserc.json` - Semantic release configuration

## Common Gotchas

- **Command registration**: Changes to `data` require `npm run deploy` - not automatic
- **Service resolution**: Services must be registered before `client.login()` in `src/index.js`, and resolved outside try-catch
- **Model loading**: Models must export function, not class. Called during `initDB()`
- **Message tracking**: Only tracks when user opts in AND `addMessages()` completes - uses await, not fire-and-forget
- **Sequelize sync**: Dev mode drops tables - don't rely on persistent data in development
- **Message history**: `getMessageData()` returns reference for atomic mutations, `getMessagesUtil()` returns copy for safety
- **Character instructions**: Always in main system prompt (util.js), summaries/mimic are additional context via `role: "system"`
- **OpenAI models**: Use gpt-4o-mini for speed, avoid json_schema format overhead, set max_tokens for faster responses

