/**
 * Package.json generator
 * Handles the complex exports mapping for different module types (ESM, CommonJS, Dual)
 */

import type { ProjectConfig } from './types.js';
import { fetchLatestVersions } from '../versionFetcher.js';
import { getNodeLTSVersions } from '../nodeFetcher.js';

interface PackageJson {
  name: string;
  version: string;
  description: string;
  type: 'module' | 'commonjs';
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, unknown>;
  files: string[];
  scripts: Record<string, string>;
  keywords: string[];
  author: string;
  license: string;
  engines: {
    node: string;
  };
  devDependencies: Record<string, string>;
  repository?: {
    type: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  homepage?: string;
}

/**
 * Generates a complete package.json based on the project configuration.
 * This is the most critical function as it handles the complex exports mapping
 * for different module types (ESM, CommonJS, Dual).
 */
export async function generatePackageJson(config: ProjectConfig): Promise<{
  packageJson: PackageJson;
  warnings: string[];
  nodeConfig: import('../nodeFetcher.js').NodeVersionConfig;
}> {
  // Format author field according to npm standards
  let authorField = '';
  if (config.author) {
    authorField = config.author;
    if (config.authorEmail) {
      authorField += ` <${config.authorEmail}>`;
    }
    if (config.githubUsername) {
      authorField += ` (https://github.com/${config.githubUsername})`;
    }
  }

  // Generate dev dependencies with dynamic version fetching
  const { devDependencies, warnings } = await generateDevDependencies(config);

  // Fetch Node.js LTS versions
  const nodeConfig = await getNodeLTSVersions();

  const pkg: PackageJson = {
    name: config.packageName,
    version: '0.1.0',
    description: config.description || 'A new npm package',
    // Set package type based on module format
    type: config.moduleType === 'commonjs' ? 'commonjs' : 'module',
    // Entry points - these depend on both language and module type
    ...generateEntryPoints(config),
    files: generateFilesList(config),
    scripts: generateScripts(config),
    keywords: [],
    author: authorField,
    license: 'MIT',
    engines: {
      node: nodeConfig.engines
    },
    devDependencies,
  };

  // Add repository field if GitHub username is provided
  if (config.githubUsername) {
    pkg.repository = {
      type: 'git',
      url: `https://github.com/${config.githubUsername}/${config.packageName}.git`,
    };
    pkg.bugs = {
      url: `https://github.com/${config.githubUsername}/${config.packageName}/issues`,
    };
    pkg.homepage = `https://github.com/${config.githubUsername}/${config.packageName}#readme`;
  }

  return { packageJson: pkg, warnings, nodeConfig };
}

/**
 * Generates the files array for package.json based on configuration
 */
function generateFilesList(config: ProjectConfig): string[] {
  if (config.language === 'javascript') {
    return ['src'];
  }

  // TypeScript projects: include dist and root index files
  const files = ['dist', 'index.js', 'index.d.ts'];

  // Dual format also needs index.mjs
  if (config.moduleType === 'dual') {
    files.push('index.mjs');
  }

  return files;
}

/**
 * Generates the entry points (main, module, types, exports) for package.json.
 * This is complex because it needs to handle:
 * - ESM-only packages
 * - CommonJS-only packages
 * - Dual packages (both ESM and CJS)
 * - TypeScript declaration files
 *
 * Key pattern (from axios/express/jsforce):
 * - Hand-written index.js and index.d.ts at package root (no dist/ prefix)
 * - These re-export from the compiled dist/ folder
 * - This ensures clean IDE autocomplete (shows package name, not package/dist)
 */
function generateEntryPoints(config: ProjectConfig): Partial<Pick<PackageJson, 'main' | 'module' | 'types' | 'exports'>> {
  const isTypeScript = config.language === 'typescript';

  const entryPoints: Partial<Pick<PackageJson, 'main' | 'module' | 'types' | 'exports'>> = {};

  // For JavaScript projects without build step
  if (!isTypeScript) {
    entryPoints.main = './src/index.js';
    if (config.moduleType === 'esm' || config.moduleType === 'dual') {
      entryPoints.module = './src/index.js';
    }
    entryPoints.exports = {
      '.': './src/index.js',
    };
    return entryPoints;
  }

  // TypeScript projects with build step
  // Use root index files (no dist/ prefix) for better IDE experience
  switch (config.moduleType) {
    case 'esm':
      // ESM-only: Root index.js re-exports from dist/
      entryPoints.main = './index.js';
      entryPoints.types = './index.d.ts';
      entryPoints.exports = {
        '.': {
          types: './index.d.ts',
          import: './index.js',
        },
      };
      break;

    case 'commonjs':
      // CommonJS-only: Root index.js re-exports from dist/
      entryPoints.main = './index.js';
      entryPoints.types = './index.d.ts';
      entryPoints.exports = {
        '.': {
          types: './index.d.ts',
          require: './index.js',
        },
      };
      break;

    case 'dual':
      // Dual format: Export both ESM (.mjs) and CJS (.js)
      // Root index files re-export from dist/
      entryPoints.main = './index.js'; // CJS default
      entryPoints.module = './index.mjs'; // ESM
      entryPoints.types = './index.d.ts';
      entryPoints.exports = {
        '.': {
          types: './index.d.ts',
          import: './index.mjs',
          require: './index.js',
        },
      };
      break;
  }

  return entryPoints;
}

/**
 * Generates npm scripts based on project configuration
 */
function generateScripts(config: ProjectConfig): Record<string, string> {
  const scripts: Record<string, string> = {};

  // Build script (only for TypeScript)
  if (config.language === 'typescript') {
    scripts.build = 'tsup';
    scripts.typecheck = 'tsc --noEmit';
  }

  // Test script
  if (config.testRunner === 'vitest') {
    scripts.test = 'vitest run';
    scripts['test:watch'] = 'vitest';
    scripts['test:coverage'] = 'vitest run --coverage';
  } else if (config.testRunner === 'jest') {
    scripts.test = 'jest';
    scripts['test:watch'] = 'jest --watch';
    scripts['test:coverage'] = 'jest --coverage';
  }

  // Linting scripts
  if (config.useLinting) {
    const ext = config.language === 'typescript' ? 'ts' : 'js';
    scripts.lint = `eslint . --ext .${ext}`;
    scripts['lint:fix'] = `eslint . --ext .${ext} --fix`;
    scripts.format = 'prettier --write "src/**/*.{ts,js,json,md}"';
    scripts['format:check'] = 'prettier --check "src/**/*.{ts,js,json,md}"';
  }

  // Package validation (only for TypeScript as it checks types)
  if (config.language === 'typescript') {
    scripts['check:exports'] = 'attw --pack';
  }

  // Prepublish hook
  if (config.language === 'typescript') {
    scripts.prepublishOnly = 'npm run build';
  }

  // Dependency sync scripts (useful for Dependabot workflow)
  if (config.useDependabot) {
    scripts.sync = 'git pull --rebase && npm install && npm test';
    scripts['sync:quick'] = 'git pull --rebase && npm install';
  }

  // Release automation scripts (only for projects with CI/CD setup)
  if (config.setupCD) {
    scripts.preversion = 'npm run build && npm test';
    scripts.release = 'node scripts/release.mjs';
  }

  return scripts;
}

/**
 * Generates the devDependencies object based on project configuration
 * Fetches latest versions dynamically from npm registry
 */
async function generateDevDependencies(config: ProjectConfig): Promise<{
  devDependencies: Record<string, string>;
  warnings: string[];
}> {
  const packagesToFetch: string[] = [];

  // TypeScript and build tools
  if (config.language === 'typescript') {
    packagesToFetch.push('typescript', 'tsup', '@types/node', '@arethetypeswrong/cli');
  }

  // Test runners
  if (config.testRunner === 'vitest') {
    packagesToFetch.push('vitest');
    // Add coverage provider when CI is enabled
    if (config.setupCI) {
      packagesToFetch.push('@vitest/coverage-v8');
    }
  } else if (config.testRunner === 'jest') {
    packagesToFetch.push('jest');
    if (config.language === 'typescript') {
      packagesToFetch.push('ts-jest', '@types/jest');
    }
  }

  // Linting tools
  if (config.useLinting) {
    if (config.language === 'typescript') {
      packagesToFetch.push('@typescript-eslint/eslint-plugin', '@typescript-eslint/parser');
    }
    packagesToFetch.push('eslint', 'prettier', 'eslint-config-prettier');
  }

  // Release automation tools (only for projects with CI/CD setup)
  if (config.setupCD) {
    packagesToFetch.push('@clack/prompts');
  }

  // Fetch all versions in parallel
  const versionMap = await fetchLatestVersions(packagesToFetch);

  // Build dependencies object
  const deps: Record<string, string> = {};
  const warnings: string[] = [];

  for (const pkg of packagesToFetch) {
    const result = versionMap.get(pkg);
    if (result) {
      deps[pkg] = result.version;
      if (result.warning) {
        warnings.push(result.warning);
      }
    }
  }

  return { devDependencies: deps, warnings };
}
