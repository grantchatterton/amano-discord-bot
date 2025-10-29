# [1.9.0](https://github.com/grantchatterton/amano-discord-bot/compare/v1.8.2...v1.9.0) (2025-10-29)


### Features

* **ci-cd:** add CI/CD pipeline with commit linting, code linting, testing, and release steps ([c0dcb59](https://github.com/grantchatterton/amano-discord-bot/commit/c0dcb5939ff97750814823a82ee1ca97da0d784d))
* **ci-cd:** add CI/CD workflow for pull requests ([01090f8](https://github.com/grantchatterton/amano-discord-bot/commit/01090f8711153be902672101c81431f9251e3843))
* **ci-cd:** add CI/CD workflow for push events ([2c2c1ba](https://github.com/grantchatterton/amano-discord-bot/commit/2c2c1badfcf948fed0c78540080c77efa6f2a919))
* **ci-cd:** add commit linter workflow for validating commit messages ([fafd1f1](https://github.com/grantchatterton/amano-discord-bot/commit/fafd1f11585d0e77c5ea6493e402e925efe4370c))
* **commands:** add 'foo' command with reply functionality ([#10](https://github.com/grantchatterton/amano-discord-bot/issues/10)) ([d31885b](https://github.com/grantchatterton/amano-discord-bot/commit/d31885b1d2d5b0757bfc18b3fc26c4ac6fcce483))
* **package:** add commitlint script for validating commit messages ([c3e0be2](https://github.com/grantchatterton/amano-discord-bot/commit/c3e0be219f2e778f366e8d0e42b3c7d47379db65))

## [1.8.2](https://github.com/grantchatterton/amano-discord-bot/compare/v1.8.1...v1.8.2) (2025-10-29)


### Bug Fixes

* **commands:** remove unused foo command implementation ([7a55fc6](https://github.com/grantchatterton/amano-discord-bot/commit/7a55fc69d052551291702cebd5b02ba2775f9796))

## [1.8.1](https://github.com/grantchatterton/amano-discord-bot/compare/v1.8.0...v1.8.1) (2025-10-29)


### Bug Fixes

* **ci-cd:** ensure lint-and-format job runs only on pull requests ([89a1593](https://github.com/grantchatterton/amano-discord-bot/commit/89a159309fefddeab0d2356b4c2de9af3c1a6bd3))
* **ci-cd:** remove conditional for commit-lint job to always run ([2f23f8b](https://github.com/grantchatterton/amano-discord-bot/commit/2f23f8ba309a2b7737af3265d7a459b965267dc6))
* **ci-cd:** remove unnecessary conditionals and standardize npm install command ([57930e7](https://github.com/grantchatterton/amano-discord-bot/commit/57930e7a9471a0adef2ae1f8e16ebd37516f7df4))
* **ci-cd:** standardize npm install command to use npm ci ([59c1dfe](https://github.com/grantchatterton/amano-discord-bot/commit/59c1dfeecd616c77b64012109a9343fc266c7863))
* **commands:** remove unused bar command implementation ([#9](https://github.com/grantchatterton/amano-discord-bot/issues/9)) ([66f6462](https://github.com/grantchatterton/amano-discord-bot/commit/66f64629092e9c1340d3d3c7129838993869904a))

# [1.8.0](https://github.com/grantchatterton/amano-discord-bot/compare/v1.7.0...v1.8.0) (2025-10-29)


### Bug Fixes

* **ci-cd:** update lint-and-format job to run ESLint and Prettier checks only ([f9ee3a4](https://github.com/grantchatterton/amano-discord-bot/commit/f9ee3a4a286fd64eeaf7b74c2ed82ff82fd15aee))
* **config:** update dotenv path resolution to use project root directory without app-root-path ([0286542](https://github.com/grantchatterton/amano-discord-bot/commit/028654249315adafb5d721742ca135f1ca0c90a2))
* **package:** update lint-staged configuration to target specific file patterns ([c5dc4a1](https://github.com/grantchatterton/amano-discord-bot/commit/c5dc4a1995459787c970bfd7603a90b4a0b75ee1))


### Features

* **package:** add lint-staged for pre-commit linting and formatting ([fff2d8b](https://github.com/grantchatterton/amano-discord-bot/commit/fff2d8b76bc56bec2247cc7231b0c315d25a54dd))

# [1.7.0](https://github.com/grantchatterton/amano-discord-bot/compare/v1.6.3...v1.7.0) (2025-10-29)


### Features

* **bar:** add new command to respond with 'bar' ([#8](https://github.com/grantchatterton/amano-discord-bot/issues/8)) ([a99447f](https://github.com/grantchatterton/amano-discord-bot/commit/a99447f3cb6869c37e38fc34e2e7a4aedd14c58c))

## [1.6.3](https://github.com/grantchatterton/amano-discord-bot/compare/v1.6.2...v1.6.3) (2025-10-29)


### Bug Fixes

* **ci-cd:** update GitHub Actions to use PA_TOKEN for authentication ([e4a7d4c](https://github.com/grantchatterton/amano-discord-bot/commit/e4a7d4cf47a6c6dd2bcbf36f0d4ba089163b357c))
* **foo:** update command description and response to 'bar' ([bc9e557](https://github.com/grantchatterton/amano-discord-bot/commit/bc9e55738109316dbf8508678db94aecfadb92df))

## [1.6.2](https://github.com/grantchatterton/amano-discord-bot/compare/v1.6.1...v1.6.2) (2025-10-29)


### Bug Fixes

* **foo:** update response message and description ([84a57b8](https://github.com/grantchatterton/amano-discord-bot/commit/84a57b8e5b2dc7a4e7394c2a2f0dc2cee88562dc))
* **loaders:** remove .js check ([ae4ecca](https://github.com/grantchatterton/amano-discord-bot/commit/ae4eccae9c5b5bde18f3333abec0ae9f56859dfc))
* **package:** add engines field to specify Node.js version requirement ([272ad96](https://github.com/grantchatterton/amano-discord-bot/commit/272ad96b6457d75bc985038ddfe27f4445c8abaa))

# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.
