# Copilot Instructions for Amano Discord Bot

## ⚠️ Critical: Commit Message Requirements

**ALL commits MUST follow Conventional Commits format or CI/CD will fail.**

Format: `type(scope): description`

Required types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Examples:
- `feat(commands): add meme randomizer`
- `fix(services): resolve message cache race condition`
- `docs(README): update setup instructions`
- `chore(deps): update discord.js to v14.16`

**NEVER use generic messages like "Initial plan", "Update files", "WIP", etc.** These will fail commitlint validation in CI/CD pipeline.

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
1. Check if message mentions "ernest" → AI-powered reply using OpenAI
2. Check for swear words → probabilistic reply with quote/image
3. AI replies include conversation history from `MessageService` (LRU-cached, summarized at limit)

## Development Workflow

### Local Development Setup
```bash
npm install
cp .env.example .env  # Add DISCORD_TOKEN, APPLICATION_ID, OPENAI_API_KEY
npm run deploy        # Register slash commands with Discord
npm start             # Run bot
```

### Code Quality Tools
- **ESLint**: Uses `eslint-config-neon` preset (Node.js + Prettier)
  - Disabled JSDoc rules: `valid-types`, `check-tag-names`, `no-undefined-types` (see `.eslintrc.json`)
  - Run: `npm run lint` (check) or `npm run lint:fix` (auto-fix)
- **Prettier**: Code formatting
  - Run: `npm run format:check` (verify) or `npm run format` (auto-format)
- **Pre-commit hooks**: Husky + lint-staged automatically runs `eslint --fix` and `prettier --write` on staged `.js` files

### Commit Message Convention
Follow Conventional Commits (enforced by commitlint): `type(scope): description`
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- **Example**: `feat(commands): add new quote randomizer command`
- Validated on push (last commit) and PRs (all commits in PR)

### Command Documentation
Run `npm run docs:commands` to regenerate the commands table in `README.md` (updates between `<!-- BEGIN COMMANDS SECTION -->` markers). This is automated in CI/CD after releases.

## CI/CD Pipeline

The project uses GitHub Actions with a multi-stage pipeline (`.github/workflows/ci-cd.yml`):

### Pipeline Stages

**1. Commit Lint** (runs on all pushes/PRs)
- Validates commit messages against Conventional Commits spec
- Push events: validates last commit only
- PR events: validates all commits from base to head

**2. Lint and Format** (PRs only)
- Runs ESLint check (`npm run lint`)
- Runs Prettier format check (`npm run format:check`)
- Blocks merge if linting/formatting fails

**3. Test** (PRs only, after lint passes)
- Runs `npm test` (currently placeholder)
- Will execute unit tests when implemented

**4. Release** (main branch pushes only, after commit-lint and test)
- Uses semantic-release with `.releaserc.json` configuration
- Auto-generates version bump based on commit types:
  - `fix:` → patch (1.0.x)
  - `feat:` → minor (1.x.0)
  - `BREAKING CHANGE:` → major (x.0.0)
- Creates GitHub release with auto-generated notes
- Updates `CHANGELOG.md`, `package.json`, `package-lock.json`
- Commit created: `chore(release): x.x.x [skip ci]`

**5. Deploy Discord Commands** (after successful release)
- Runs `npm run deploy` to register slash commands with Discord API
- Regenerates README command docs (`npm run docs:commands`)
- Auto-commits updated README if changes detected
- Requires secrets: `DISCORD_TOKEN`, `APPLICATION_ID`

**6. Deploy Docker** (after successful release, parallel with Discord deploy)
- Builds multi-platform images (linux/amd64, linux/arm64)
- Tags: `username/repo:x.x.x` and `username/repo:latest`
- Pushes to Docker Hub with build cache optimization
- Requires secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`

**7. Deploy Production** (after Docker deploy or manual trigger)
- SSHs into VPS using `appleboy/ssh-action`
- Runs: `docker compose down --rmi all && docker compose up -d --pull always`
- Requires secrets: `VPS_HOST`, `VPS_USERNAME`, `SSH_PRIVATE_KEY`, `VPS_PATH`

### Workflow Triggers
- **Push to main** (src/**, tests/**): Full pipeline with release + deployment
- **Pull requests**: Lint, format, and test only (no release/deploy)
- **Manual dispatch**: Available for production deployment

### Required GitHub Secrets
- `DISCORD_TOKEN`: Bot token for command registration
- `APPLICATION_ID`: Discord app ID for command registration
- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token
- `VPS_HOST`: Production server hostname/IP
- `VPS_USERNAME`: SSH user for VPS
- `SSH_PRIVATE_KEY`: Private key for SSH authentication
- `VPS_PATH`: Path to docker-compose.yml on VPS

### Release Configuration
Semantic-release plugins (`.releaserc.json`):
- Commit analyzer + release notes generator
- Changelog generation
- NPM version bump (publish disabled)
- Git asset commits (package.json, CHANGELOG.md)
- GitHub release creation

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

## Docker Deployment

### Local Docker Build and Run
```bash
# Build image
docker build -t amano-discord-bot:latest .

# Run with .env file (recommended)
docker run --env-file .env --name amano-discord-bot --restart unless-stopped -d amano-discord-bot:latest

# Or with explicit environment variables
docker run -e DISCORD_TOKEN=xxx -e APPLICATION_ID=xxx -e OPENAI_API_KEY=xxx \
  --name amano-discord-bot --restart unless-stopped -d amano-discord-bot:latest
```

### Docker Compose (Development)
```bash
# Create .env file first with required vars
docker compose up --build
```

### Docker Image Details
- Base: `node:lts-bookworm-slim` (Debian-based, minimal footprint)
- Non-root user: `appuser` for security
- Production deps only: `npm ci --omit=dev`
- Entry point: `node src/index.js`
- Multi-platform support: linux/amd64, linux/arm64

### Production Deployment Pattern
The VPS deployment uses docker-compose with the following strategy:
1. `docker compose down --rmi all` - Stop and remove old containers/images
2. `docker compose up -d --pull always` - Pull latest image and start detached
3. Compose file loads `.env` from VPS deployment directory
4. Image pulled: `dockerhub_username/amano-discord-bot:latest`
