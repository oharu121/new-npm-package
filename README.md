# forge-npm-pkg

[![npm version](https://badge.fury.io/js/forge-npm-pkg.svg)](https://badge.fury.io/js/forge-npm-pkg)
![License](https://img.shields.io/npm/l/forge-npm-pkg)
![Types](https://img.shields.io/npm/types/forge-npm-pkg)
![NPM Downloads](https://img.shields.io/npm/dw/forge-npm-pkg)
![Last Commit](https://img.shields.io/github/last-commit/oharu121/forge-npm-pkg)
![Coverage](https://codecov.io/gh/oharu121/forge-npm-pkg/branch/main/graph/badge.svg)
![CI Status](https://github.com/oharu121/forge-npm-pkg/actions/workflows/ci.yml/badge.svg)
![GitHub Stars](https://img.shields.io/github/stars/oharu121/forge-npm-pkg?style=social)

A powerful CLI tool to scaffold production-ready npm packages with modern best practices.

## Features

- Interactive CLI with beautiful prompts
- TypeScript or JavaScript support
- Multiple module formats: ESM, CommonJS, or Dual (both)
- Built-in testing with Vitest or Jest
- ESLint + Prettier for code quality
- GitHub Actions CI/CD workflows (optional)
- Automated publishing with simple tag-based workflow
- Test coverage tracking with Codecov (optional)
- Automated dependency updates with Dependabot (optional)
- User configuration storage (save author info for future projects)
- Package export validation with `@arethetypeswrong/cli`
- Proper `package.json` exports configuration
- Git repository initialization

## Usage

### Create a new package

```bash
npx forge-npm-pkg my-awesome-package
```

Or without specifying a name (you'll be prompted):

```bash
npx forge-npm-pkg
```

## What Gets Generated?

The CLI will ask you several questions and generate a complete project structure:

### Questions

1. **Language**: TypeScript or JavaScript
2. **Module Format**: ESM (Modern), CommonJS (Legacy), or Dual (ESM + CJS)
3. **Test Runner**: Vitest, Jest, or None
4. **Linting**: Initialize ESLint + Prettier?
5. **Git**: Initialize a new git repository?
6. **CI/CD**: Set up GitHub Actions workflows?
7. **Coverage**: Upload test coverage to Codecov? (optional, requires tests)
8. **Dependencies**: Set up Dependabot for automated dependency updates? (optional)

### Generated Structure

```
my-awesome-package/
├── src/
│   ├── index.ts (or .js)
│   └── index.test.ts (if testing enabled)
├── .github/
│   ├── workflows/
│   │   ├── ci.yml (if CI enabled)
│   │   └── publish.yml (if CD enabled)
│   └── dependabot.yml (if Dependabot enabled)
├── package.json
├── tsconfig.json (if TypeScript)
├── tsup.config.ts (if TypeScript)
├── vitest.config.ts (if Vitest selected)
├── jest.config.ts (if Jest selected)
├── .eslintrc.json (if linting enabled)
├── .prettierrc (if linting enabled)
├── .gitignore
└── README.md
```

## The Generated Package

Your generated package will have:

### Scripts

- `npm run build` - Build the package with tsup
- `npm test` - Run tests
- `npm run lint` - Lint your code
- `npm run format` - Format code with Prettier
- `npm run check:exports` - Validate package exports
- `npm run typecheck` - Type-check TypeScript (if applicable)

### Best Practices

1. **Proper Package Exports**: The `package.json` includes correctly configured `exports` field for maximum compatibility
2. **Type Safety**: TypeScript with strict mode enabled
3. **Testing**: Pre-configured testing framework with example tests
4. **Code Quality**: ESLint and Prettier with sensible defaults
5. **CI/CD**: GitHub Actions workflow for automated releases
6. **Module Formats**: Support for ESM, CommonJS, or both (dual)

## Module Format Details

### ESM (Recommended)

Modern ECMAScript modules with `import`/`export` syntax.

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

### CommonJS

Legacy Node.js module format with `require()`.

```json
{
  "type": "commonjs",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "require": "./dist/index.js"
    }
  }
}
```

### Dual (Maximum Compatibility)

Exports both ESM and CommonJS for maximum compatibility.

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  }
}
```

## Complete Workflow Guide

This section walks you through the entire process of creating and publishing an npm package with automated CI/CD.

### 1. Initial Setup

Create your package with automated publishing enabled:

```bash
npx forge-npm-pkg my-awesome-package
```

**Select these options:**
- Language: TypeScript (recommended)
- Module format: ESM (modern)
- Test runner: Vitest (fast & modern)
- Linting: Yes (ESLint + Prettier)
- Git: Yes (initialize repository)
- CI: Yes (run tests on every push)
- CD: Yes (automated publishing)

The tool will:
- ✓ Create project structure
- ✓ Install dependencies
- ✓ Initialize git repository
- ✓ Create GitHub Actions workflows (CI + Publish)
- ✓ Run initial build to verify setup

### 2. Create GitHub Repository

```bash
cd my-awesome-package

# Create repository on GitHub (using GitHub CLI)
gh repo create my-awesome-package --public --source=. --remote=origin

# Or manually:
# 1. Go to https://github.com/new
# 2. Create repository named "my-awesome-package"
# 3. Follow GitHub's instructions to push existing repository

# Push to GitHub
git remote add origin https://github.com/yourusername/my-awesome-package.git
git branch -M main
git push -u origin main
```

### 3. Add NPM Token to GitHub

To enable automated publishing, you need to add your npm token to GitHub:

**A. Create NPM Access Token:**

1. Go to [npmjs.com](https://www.npmjs.com)
2. Click your profile → Access Tokens
3. Click "Generate New Token" → "Classic Token"
4. Select type: **Automation** (for CI/CD)
5. Copy the token (starts with `npm_...`)

**B. Add Token to GitHub:**

```bash
# Using GitHub CLI (recommended)
gh secret set NPM_TOKEN

# Or manually:
# 1. Go to https://github.com/yourusername/my-awesome-package/settings/secrets/actions
# 2. Click "New repository secret"
# 3. Name: NPM_TOKEN
# 4. Value: [paste your npm token]
# 5. Click "Add secret"
```

### 4. Develop Your Package

**Write your code:**

```typescript
// src/index.ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function add(a: number, b: number): number {
  return a + b;
}
```

**Write tests:**

```typescript
// src/index.test.ts
import { describe, it, expect } from 'vitest';
import { greet, add } from './index.js';

describe('greet', () => {
  it('should return a greeting message', () => {
    expect(greet('World')).toBe('Hello, World!');
  });
});

describe('add', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

**Run tests locally:**

```bash
npm test              # Run tests
npm run build         # Build package
npm run typecheck     # Type checking
npm run lint          # Lint code
```

### 5. Commit and Push Changes

```bash
git add .
git commit -m "feat: add greet function"
git push
```

**What happens automatically:**
1. ✓ GitHub Actions runs CI workflow
2. ✓ Tests are executed
3. ✓ TypeScript type checking runs
4. ✓ Linting checks run
5. ✓ Build is verified

### 6. Create a Release (Version Bump)

When you're ready to publish to npm:

```bash
# Bump version based on change type
npm version patch  # Bug fixes: 1.0.0 → 1.0.1
npm version minor  # New features: 1.0.0 → 1.1.0
npm version major  # Breaking changes: 1.0.0 → 2.0.0

# Push the tag
git push && git push --tags
```

**What happens automatically when you push the tag:**
1. ✓ GitHub Actions publish workflow triggers
2. ✓ Dependencies are installed
3. ✓ Tests are executed
4. ✓ Build runs
5. ✓ **Package is published to npm** 🎉

### 7. Verify Publication

```bash
# Check npm
npm view my-awesome-package

# Install in another project
npm install my-awesome-package
```

### 8. Ongoing Development Workflow

For every new feature or bug fix:

```bash
# 1. Make changes
vim src/index.ts

# 2. Write tests
vim src/index.test.ts

# 3. Run tests locally
npm test

# 4. Commit and push
git add .
git commit -m "fix: resolve edge case in greet()"
git push

# 5. Wait for CI to pass

# 6. When ready to release:
npm version patch  # or minor/major
git push && git push --tags

# 7. Package auto-publishes to npm!
```

### Common Scenarios

#### Multiple Changes Before Release

You can commit multiple changes before creating a release:

```bash
# Feature 1
git add .
git commit -m "feat: add multiply function"
git push

# Feature 2
git add .
git commit -m "feat: add divide function"
git push

# Bug fix
git add .
git commit -m "fix: handle negative numbers"
git push

# All CI checks pass, now release
npm version minor  # Bump version for new features
git push && git push --tags  # Auto-publishes to npm
```

All changes since the last release will be included.

#### Emergency Patch Release

```bash
# Fix critical bug
vim src/index.ts
npm test

# Push immediately
git add .
git commit -m "fix: critical bug in production"
git push

# Wait for CI to pass, then release
npm version patch
git push && git push --tags
# Package publishes automatically
```

#### Manual Version Release

If you need to publish manually (bypass CI/CD):

```bash
# Build and publish
npm run build
npm publish --access public
```

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. Developer writes code + tests                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 2. git commit + git push                                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 3. GitHub Actions CI runs (tests, lint, build)          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 4. Developer runs: npm version patch/minor/major        │
│    - Bumps version in package.json                      │
│    - Creates git commit and tag                         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 5. git push && git push --tags                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 6. GitHub Actions Publish workflow triggers             │
│    - Installs dependencies                              │
│    - Runs tests                                         │
│    - Builds package                                     │
│    - Publishes to npm                                   │
└─────────────────────────────────────────────────────────┘
```

### Troubleshooting

**CI fails on push:**
- Check GitHub Actions tab for error details
- Run `npm run build` and `npm test` locally first
- Ensure all tests pass before pushing

**NPM_TOKEN error during publish:**
- Verify token is added to GitHub secrets
- Token must be "Automation" type, not "Publish"
- Check token hasn't expired

**Publish workflow not triggering:**
- Ensure you pushed the tag: `git push --tags`
- Check tag format matches `v*` (e.g., v1.0.0)
- Verify `.github/workflows/publish.yml` exists

**Package not publishing:**
- Check package name is available on npm
- Verify NPM_TOKEN is correct
- Check GitHub Actions logs for error details
- Ensure tests pass before publishing

## Configuration Management

### User Config Storage

Save your author information once and reuse it for future projects:

```bash
# First time - you'll be prompted to save
npx forge-npm-pkg my-package
# Enter your name, email, GitHub username
# Choose "Yes" when asked to save for future projects

# Future runs - config loaded automatically
npx forge-npm-pkg another-package
# Your info is pre-filled!
```

**Smart Git Integration:**

- Automatically detects git config (user.name, user.email)
- Asks for confirmation: "Use git config: Name <email>?"
- Only prompts for GitHub username if you confirm

**Config Commands:**

```bash
# View stored configuration
npx forge-npm-pkg --config

# Reset stored configuration
npx forge-npm-pkg --reset-config

# Skip saving config this time
npx forge-npm-pkg my-package --no-save
```

**Storage Location:**

- Windows: `C:\Users\{user}\AppData\Roaming\forge-npm-pkg\config.json`
- Mac/Linux: `~/.config/forge-npm-pkg/config.json`

## Requirements

- Node.js >= 18.0.0
- npm, pnpm, yarn, or bun

## Development

### Build this CLI tool

```bash
git clone https://github.com/yourusername/forge-npm-pkg
cd forge-npm-pkg
npm install
npm run build
```

### Testing Strategy

This project uses a multi-layered testing approach to ensure quality:

#### 1. Unit Tests (Vitest)

Test individual generator functions and validators:

```bash
npm test                    # Run unit tests once
npm run test:watch          # Run in watch mode
npm run test:coverage       # Generate coverage report
npm run test:ui             # Interactive UI mode
```

#### 2. E2E Tests

Automated end-to-end tests that verify the full CLI workflow:

```bash
npm run test:e2e            # Creates project, runs build and tests
```

#### 3. Developer Testing (Experience the CLI)

Quick scripts to manually test the CLI flow and UX:

```bash
npm run dev:test            # Interactive mode - experience all prompts
npm run dev:test:quick      # Quick mode with -y flag
```

These generate projects in `.dev-test/` which is auto-cleaned and gitignored.

**Why separate dev testing?**

- Unit/E2E tests verify correctness
- Dev testing validates UX and flow
- Allows you to experience the CLI as users do
- Quick iteration on prompts and messaging

#### 4. CI/CD (GitHub Actions)

Automated testing on every push:

- Runs on Node 18 & 20
- Type checking
- Unit tests
- E2E tests
- Coverage reporting

### Run All Tests

```bash
npm run test:all            # Typecheck + Unit + E2E
```

### Test locally with npm link

```bash
npm link
forge-npm-pkg test-package
```

## Why This Tool?

Creating a properly configured npm package is complex:

- Module format confusion (ESM vs CJS)
- Incorrect `package.json` exports
- TypeScript configuration
- Build tool setup
- Testing configuration
- CI/CD pipelines

This tool eliminates the guesswork and gives you a production-ready setup in seconds.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR.
