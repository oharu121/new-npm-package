# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1]

### Added

- `test:coverage` script automatically added to generated projects when CI is enabled
- `@vitest/coverage-v8` package automatically installed when using Vitest with CI enabled
- Test coverage collection in CI workflows - runs `npm run test:coverage` instead of `npm test`

### Changed

- CI workflows now collect test coverage by default when tests are configured
- Coverage reports are generated on every CI run for better visibility into test quality

## [1.2.0] - 2025-11-16

### Added

- Logo banner and version number display at startup for better branding and visual identity
- `useCodecov` option to make test coverage tracking opt-in (default: false)
- `useDependabot` option for automated dependency updates (default: false)
- Educational notes before each prompt explaining benefits and requirements
- Conditional Codecov integration in CI workflow (only when opted-in, prevents failures when token is missing)
- `.github/dependabot.yml` generation when Dependabot is opted-in
- Conditional README badges (Codecov and CI status only shown when relevant)
- Simple tag-based CD workflow (`publish.yml`) that triggers on git tags
- Dependabot configuration for forge-npm-pkg repository maintenance

### Changed

- **BREAKING**: Removed preset selection (Library/CLI/Legacy/Custom) for cleaner, more intuitive UX
- **BREAKING**: Removed Changesets from both forge-npm-pkg and generated projects - now uses simple tag-based workflow
- Interactive mode now directly asks all configuration questions instead of choosing presets
- TypeScript is now the default language (first option, just press Enter)
- Educational notes now appear BEFORE all prompts (not after user makes selection)
- Updated language hints: "Recommended - Modern standard" for TypeScript vs "Simple projects only" for JavaScript
- CD workflow now uses git tags (`v*`) instead of Changesets for automated publishing
- Simplified CD setup: `npm version` + `git push --tags` instead of Changesets workflow
- `--yes` flag continues to work with sensible defaults (no breaking change for this usage)

### Improved

- Added warning when JavaScript is selected to guide users toward TypeScript best practices
- More consistent experience across all usage modes
- Less code to maintain, fewer potential bugs
- Better user education through contextual prompts
- Simpler release workflow without Changesets complexity
- CD prompt now explains tag-based workflow with clear step-by-step instructions

### Fixed

- CD (Automated Publishing) benefits note now appears BEFORE the prompt, not after selection
- All optional features (Codecov, Dependabot, CD) now follow consistent "inform then ask" pattern

### Removed

- Changesets dependency and all related scripts
- Changesets configuration files (`.changeset/`)
- `release.yml` workflow (replaced with simpler `publish.yml`)

## [1.1.0] - 2025-11-14

### Added

- Explicit user confirmation prompt before installing npm packages - asks "Install dependencies now?" instead of installing automatically
- Live npm progress output during dependency installation - users can now see real-time installation progress instead of a frozen screen
- Clear messaging before and after installation with timing expectations ("This may take a minute. Please wait...")

### Changed

- Installation process now requires explicit user consent in interactive mode (still auto-installs with `--yes` flag)
- Changed from hidden installation output (`stdio: "pipe"`) to visible output (`stdio: "inherit"`) for transparency
- Improved "Next steps" instructions to accurately show install command only when dependencies weren't installed

### Fixed

- Fixed misleading UX where screen appeared frozen during npm install with no feedback
- Fixed post-install tasks (git init, build verification) to check actual installation status instead of just the `--skip-install` flag
- Fixed logic to properly track whether installation actually happened vs just checking the CLI flag

### Security

- Follows npm/npx security best practice of prompting before installing packages (prevents unexpected network operations)

## [1.0.1] - 2025-11-13

### Added

- Initial release with comprehensive npm package scaffolding
- Interactive CLI with beautiful prompts using @clack/prompts
- Support for TypeScript and JavaScript
- Support for ESM, CommonJS, and Dual module formats
- Testing framework integration (Vitest, Jest)
- Linting and formatting setup (ESLint, Prettier, EditorConfig)
- CI/CD workflow generation (GitHub Actions)
- User configuration storage with git integration
- Package name availability check
- Preset modes (Library, CLI Tool, Legacy)
- Comprehensive documentation and examples

### Features

- `-y, --yes` flag for quick setup with defaults
- `--skip-install` flag to skip dependency installation
- `--dry-run` flag to preview generated files
- `--config` flag to show stored user configuration
- `--reset-config` flag to clear stored configuration
- `--no-save` flag to prevent saving user info
- Custom configuration mode with full control
- Automatic package manager detection (npm, pnpm, yarn, bun)
- Post-install verification (runs build to ensure setup works)
- Parallel post-install tasks (git init, changesets setup)

[Unreleased]: https://github.com/oharu121/forge-npm-pkg/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/oharu121/forge-npm-pkg/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/oharu121/forge-npm-pkg/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/oharu121/forge-npm-pkg/releases/tag/v1.0.1
