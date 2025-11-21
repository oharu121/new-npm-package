/**
 * Generator functions for creating configuration files
 *
 * This barrel file re-exports all generator functions from their respective modules.
 * Each module is organized by domain:
 * - packageJson: Package.json with exports configuration
 * - readme: README with badges and conditional sections
 * - typescript: TypeScript configurations (tsconfig, tsup)
 * - linting: Code quality tools (ESLint, Prettier, EditorConfig)
 * - testing: Test framework configurations (Vitest, Jest)
 * - files: Simple file generators (gitignore, root index files)
 */

// Export types
export type { ProjectConfig } from './types.js';

// Package.json generator
export { generatePackageJson } from './packageJson.js';

// README generator
export { generateReadme } from './readme.js';

// TypeScript generators
export { generateTsConfig, generateTsupConfig } from './typescript.js';

// Linting generators
export { generateEslintConfig, generatePrettierConfig, generateEditorConfig } from './linting.js';

// Testing generators
export { generateVitestConfig, generateJestConfig } from './testing.js';

// File generators
export {
  generateGitignore,
  generateNpmignore,
  generateRootIndexJs,
  generateRootIndexMjs,
  generateRootIndexDts,
  generateReleaseScript,
} from './files.js';

// GitHub Actions workflow generators
export { generateCIWorkflow, generateDependabotConfig } from './workflows.js';
