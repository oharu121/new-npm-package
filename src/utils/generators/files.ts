/**
 * File generators for .gitignore and root index files
 * These are simpler, static file generators
 */

import type { ProjectConfig } from './types.js';

/**
 * Generates .gitignore
 */
export function generateGitignore(): string {
  return `# Dependencies
node_modules/
.pnp/
.pnp.js

# Testing
coverage/
*.lcov
.nyc_output/

# Build output
dist/
build/
*.tsbuildinfo

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Temporary files
*.tmp
.cache/
.temp/

# Package manager files
.yarn/
.pnpm-store/
.npm/
package-lock.json
yarn.lock
pnpm-lock.yaml
bun.lockb
`;
}

/**
 * Generates root index.js that re-exports from dist/
 * This follows the pattern used by axios, express, and jsforce
 * for better IDE autocomplete experience
 */
export function generateRootIndexJs(config: ProjectConfig): string {
  const { packageName, moduleType } = config;

  // For dual format, we generate both index.js (CJS) and index.mjs (ESM)
  // This is the CommonJS version
  if (moduleType === 'commonjs' || moduleType === 'dual') {
    return `/**
 * ${packageName}
 *
 * @license MIT
 */

'use strict';

module.exports = require('./dist/index.js');
module.exports.default = require('./dist/index.js').default;
`;
  }

  // ESM format
  return `/**
 * ${packageName}
 *
 * @license MIT
 */

export * from './dist/index.js';
export { default } from './dist/index.js';
`;
}

/**
 * Generates root index.mjs for dual format packages
 * This is the ESM version for dual packages
 */
export function generateRootIndexMjs(config: ProjectConfig): string {
  const { packageName } = config;

  return `/**
 * ${packageName}
 *
 * @license MIT
 */

export * from './dist/index.mjs';
export { default } from './dist/index.mjs';
`;
}

/**
 * Generates root index.d.ts that re-exports types from dist/
 * This ensures TypeScript can find types without dist/ prefix
 */
export function generateRootIndexDts(config: ProjectConfig): string {
  const { packageName, moduleType } = config;

  // For dual format, types reference .mjs for ESM
  const typeReference = moduleType === 'dual' ? './dist/index' : './dist/index';

  return `/**
 * ${packageName} - Type Definitions
 *
 * @license MIT
 */

export * from '${typeReference}';
export { default } from '${typeReference}';
`;
}
