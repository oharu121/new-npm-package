# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/oharu121/forge-npm-pkg/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/oharu121/forge-npm-pkg/releases/tag/v1.0.1
