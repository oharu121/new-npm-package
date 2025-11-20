/**
 * Linting and formatting configuration generators
 * Handles ESLint, Prettier, and EditorConfig
 */

import type { ProjectConfig } from './types.js';

interface ESLintConfig {
  env: {
    node: boolean;
    es2021: boolean;
  };
  extends: string[];
  parserOptions: {
    ecmaVersion: string;
    sourceType: string;
  };
  rules: Record<string, unknown>;
  parser?: string;
  plugins?: string[];
}

interface PrettierConfig {
  semi: boolean;
  trailingComma: string;
  singleQuote: boolean;
  printWidth: number;
  tabWidth: number;
  useTabs: boolean;
}

/**
 * Generates ESLint configuration
 */
export function generateEslintConfig(config: ProjectConfig): ESLintConfig {
  const eslintConfig: ESLintConfig = {
    env: {
      node: true,
      es2021: true,
    },
    extends: ['eslint:recommended'],
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  };

  // TypeScript-specific config
  if (config.language === 'typescript') {
    eslintConfig.parser = '@typescript-eslint/parser';
    eslintConfig.plugins = ['@typescript-eslint'];
    eslintConfig.extends.push(
      'plugin:@typescript-eslint/recommended',
      'prettier'
    );
  } else {
    eslintConfig.extends.push('prettier');
  }

  return eslintConfig;
}

/**
 * Generates Prettier configuration
 */
export function generatePrettierConfig(): PrettierConfig {
  return {
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
  };
}

/**
 * Generates .editorconfig for consistent editor settings
 */
export function generateEditorConfig(): string {
  return `# EditorConfig is awesome: https://EditorConfig.org

# top-most EditorConfig file
root = true

# Unix-style newlines with a newline ending every file
[*]
end_of_line = lf
insert_final_newline = true
charset = utf-8
trim_trailing_whitespace = true

# TypeScript/JavaScript
[*.{ts,tsx,js,jsx,mjs,cjs}]
indent_style = space
indent_size = 2

# JSON
[*.json]
indent_style = space
indent_size = 2

# YAML
[*.{yml,yaml}]
indent_style = space
indent_size = 2

# Markdown
[*.md]
trim_trailing_whitespace = false
`;
}
