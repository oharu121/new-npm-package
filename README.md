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
- Automated releases with Changesets
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
5. **Automation**: Set up automated releases with Changesets?
6. **Git**: Initialize a new git repository?

### Generated Structure

```
my-awesome-package/
├── src/
│   ├── index.ts (or .js)
│   └── index.test.ts (if testing enabled)
├── .github/
│   └── workflows/
│       └── release.yml (if Changesets enabled)
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

## Publishing Your Package

### Manual Publishing

```bash
cd my-awesome-package
npm run build
npm publish
```

### Automated Publishing with Changesets

If you enabled Changesets, use this workflow:

1. Make your changes
2. Run `npx changeset` to create a changeset
3. Commit and push to GitHub
4. The CI will create a release PR
5. Merge the PR to publish automatically

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
