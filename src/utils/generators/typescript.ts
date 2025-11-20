/**
 * TypeScript configuration generators
 * Handles tsconfig.json and tsup.config.ts generation
 */

import type { ProjectConfig } from './types.js';

interface TSConfig {
  compilerOptions: {
    target: string;
    module: string;
    lib: string[];
    moduleResolution: string;
    outDir: string;
    rootDir: string;
    strict: boolean;
    esModuleInterop: boolean;
    skipLibCheck: boolean;
    forceConsistentCasingInFileNames: boolean;
    declaration: boolean;
    declarationMap: boolean;
    sourceMap: boolean;
    noUnusedLocals: boolean;
    noUnusedParameters: boolean;
    noImplicitReturns: boolean;
    noFallthroughCasesInSwitch: boolean;
    resolveJsonModule: boolean;
    allowSyntheticDefaultImports: boolean;
  };
  include: string[];
  exclude: string[];
}

/**
 * Generates tsconfig.json for TypeScript projects
 */
export function generateTsConfig(config: ProjectConfig): TSConfig {
  const moduleResolution = config.moduleType === 'commonjs' ? 'node' : 'bundler';
  const module = config.moduleType === 'commonjs' ? 'CommonJS' : 'ESNext';

  return {
    compilerOptions: {
      // Target modern JavaScript
      target: 'ES2020',
      module,
      lib: ['ES2020'],
      moduleResolution,

      // Output directory
      outDir: './dist',
      rootDir: './src',

      // Enable all strict checks
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,

      // Declaration files
      declaration: true,
      declarationMap: true,

      // Source maps for debugging
      sourceMap: true,

      // Additional checks
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,

      // Module resolution
      resolveJsonModule: true,
      allowSyntheticDefaultImports: true,
    },
    include: ['src/**/*'],
    // Exclude root index files (they're hand-written, not compiled)
    exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts', 'index.js', 'index.d.ts', 'index.mjs'],
  };
}

/**
 * Generates tsup.config.ts for building TypeScript packages
 */
export function generateTsupConfig(config: ProjectConfig): string {
  const formats: string[] = [];

  // Determine output formats based on module type
  if (config.moduleType === 'esm') {
    formats.push("'esm'");
  } else if (config.moduleType === 'commonjs') {
    formats.push("'cjs'");
  } else {
    // Dual format
    formats.push("'cjs'", "'esm'");
  }

  return `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: [${formats.join(', ')}],
  dts: true, // Generate declaration files
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
`;
}
