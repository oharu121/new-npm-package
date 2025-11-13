/**
 * Testing framework configuration generators
 * Handles Vitest and Jest configurations
 */

import type { ProjectConfig } from './types.js';

/**
 * Generates Vitest configuration
 */
export function generateVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
`;
}

/**
 * Generates Jest configuration
 */
export function generateJestConfig(config: ProjectConfig): string {
  if (config.language === 'typescript') {
    const preset = config.moduleType === 'esm' ? 'ts-jest/presets/default-esm' : 'ts-jest';
    const extensionsToTreatAsEsm = config.moduleType === 'esm' ? "  extensionsToTreatAsEsm: ['.ts'],\n" : '';

    return `import type { Config } from 'jest';

const config: Config = {
  preset: '${preset}',
${extensionsToTreatAsEsm}  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
};

export default config;
`;
  } else {
    return `export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
  ],
};
`;
  }
}
