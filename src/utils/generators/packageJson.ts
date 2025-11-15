/**
 * Package.json generator
 * Handles the complex exports mapping for different module types (ESM, CommonJS, Dual)
 */

import type { ProjectConfig } from './types.js';

/**
 * Generates a complete package.json based on the project configuration.
 * This is the most critical function as it handles the complex exports mapping
 * for different module types (ESM, CommonJS, Dual).
 */
export function generatePackageJson(config: ProjectConfig): Record<string, any> {
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

  const pkg: Record<string, any> = {
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
    devDependencies: generateDevDependencies(config),
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

  return pkg;
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
function generateEntryPoints(config: ProjectConfig): Record<string, any> {
  const isTypeScript = config.language === 'typescript';

  const entryPoints: Record<string, any> = {};

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
  } else if (config.testRunner === 'jest') {
    scripts.test = 'jest';
    scripts['test:watch'] = 'jest --watch';
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

  return scripts;
}

/**
 * Generates the devDependencies object based on project configuration
 */
function generateDevDependencies(config: ProjectConfig): Record<string, string> {
  const deps: Record<string, string> = {};

  // TypeScript and build tools
  if (config.language === 'typescript') {
    deps.typescript = '^5.3.3';
    deps.tsup = '^8.0.1';
    deps['@types/node'] = '^20.11.0';
    // Package validation tool
    deps['@arethetypeswrong/cli'] = '^0.15.0';
  }

  // Test runners
  if (config.testRunner === 'vitest') {
    deps.vitest = '^1.2.0';
  } else if (config.testRunner === 'jest') {
    deps.jest = '^29.7.0';
    if (config.language === 'typescript') {
      deps['ts-jest'] = '^29.1.1';
      deps['@types/jest'] = '^29.5.11';
    }
  }

  // Linting tools
  if (config.useLinting) {
    if (config.language === 'typescript') {
      deps['@typescript-eslint/eslint-plugin'] = '^6.19.0';
      deps['@typescript-eslint/parser'] = '^6.19.0';
    }
    deps.eslint = '^8.56.0';
    deps.prettier = '^3.2.4';
    deps['eslint-config-prettier'] = '^9.1.0';
  }

  return deps;
}
