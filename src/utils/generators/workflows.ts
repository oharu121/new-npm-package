/**
 * GitHub Actions workflow generators
 */

import type { ProjectConfig } from './types.js';

/**
 * Generates a CI workflow for GitHub Actions
 * Runs tests, type checking, and linting on push and PR
 */
export function generateCIWorkflow(config: ProjectConfig): string {
  const nodeVersions = ['18', '20', '22'];

  // Build the steps dynamically based on config
  const steps: string[] = [
    `      - name: Checkout code
        uses: actions/checkout@v4`,

    `      - name: Setup Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}`,

    `      - name: Install dependencies
        run: npm install`,
  ];

  // Add typecheck step for TypeScript projects
  if (config.language === 'typescript') {
    steps.push(`      - name: Type check
        run: npm run typecheck`);
  }

  // Add lint step if linting is enabled
  if (config.useLinting) {
    steps.push(`      - name: Lint
        run: npm run lint`);
  }

  // Add test step if tests are configured
  if (config.testRunner !== 'none') {
    steps.push(`      - name: Run tests
        run: npm test`);
  }

  // Add build step
  steps.push(`      - name: Build
        run: npm run build`);

  // Add coverage upload only for Node 20 (avoid duplicate uploads)
  if (config.testRunner !== 'none') {
    steps.push(`      - name: Upload coverage to Codecov
        if: matrix.node-version == '20'
        uses: codecov/codecov-action@v4
        with:
          token: \${{ secrets.CODECOV_TOKEN }}`);
  }

  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [${nodeVersions.join(', ')}]
    steps:
${steps.join('\n\n')}
`;
}

/**
 * Generates a CD workflow for GitHub Actions
 * Publishes to npm when a GitHub release is created
 */
export function generateCDWorkflow(config: ProjectConfig): string {
  const steps: string[] = [
    `      - name: Checkout code
        uses: actions/checkout@v4`,

    `      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'`,

    `      - name: Install dependencies
        run: npm install`,
  ];

  // Add typecheck for TypeScript projects
  if (config.language === 'typescript') {
    steps.push(`      - name: Type check
        run: npm run typecheck`);
  }

  // Add tests if configured
  if (config.testRunner !== 'none') {
    steps.push(`      - name: Run tests
        run: npm test`);
  }

  // Add build
  steps.push(`      - name: Build
        run: npm run build`);

  // Add publish step
  steps.push(`      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}`);

  return `name: Publish

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
${steps.join('\n\n')}
`;
}
