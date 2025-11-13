import { describe, it, expect } from 'vitest';
import { generatePackageJson } from './packageJson';
import type { ProjectConfig } from './types';

describe('generatePackageJson', () => {
  const baseConfig: ProjectConfig = {
    packageName: 'test-package',
    language: 'typescript',
    moduleType: 'esm',
    testRunner: 'vitest',
    useLinting: true,
    useChangesets: false,
    initGit: true,
    packageManager: 'npm',
  };

  describe('basic fields', () => {
    it('should generate basic package.json fields', () => {
      const pkg = generatePackageJson(baseConfig);

      expect(pkg.name).toBe('test-package');
      expect(pkg.version).toBe('0.1.0');
      expect(pkg.description).toBe('A new npm package');
      expect(pkg.license).toBe('MIT');
    });

    it('should use custom description when provided', () => {
      const config = { ...baseConfig, description: 'My custom package' };
      const pkg = generatePackageJson(config);

      expect(pkg.description).toBe('My custom package');
    });
  });

  describe('author field formatting', () => {
    it('should format author with name only', () => {
      const config = { ...baseConfig, author: 'John Doe' };
      const pkg = generatePackageJson(config);

      expect(pkg.author).toBe('John Doe');
    });

    it('should format author with name and email', () => {
      const config = {
        ...baseConfig,
        author: 'John Doe',
        authorEmail: 'john@example.com',
      };
      const pkg = generatePackageJson(config);

      expect(pkg.author).toBe('John Doe <john@example.com>');
    });

    it('should format author with name, email, and GitHub', () => {
      const config = {
        ...baseConfig,
        author: 'John Doe',
        authorEmail: 'john@example.com',
        githubUsername: 'johndoe',
      };
      const pkg = generatePackageJson(config);

      expect(pkg.author).toBe('John Doe <john@example.com> (https://github.com/johndoe)');
    });

    it('should format author with name and GitHub only', () => {
      const config = {
        ...baseConfig,
        author: 'John Doe',
        githubUsername: 'johndoe',
      };
      const pkg = generatePackageJson(config);

      expect(pkg.author).toBe('John Doe (https://github.com/johndoe)');
    });
  });

  describe('GitHub repository fields', () => {
    it('should add repository fields when GitHub username is provided', () => {
      const config = {
        ...baseConfig,
        githubUsername: 'johndoe',
      };
      const pkg = generatePackageJson(config);

      expect(pkg.repository).toEqual({
        type: 'git',
        url: 'https://github.com/johndoe/test-package.git',
      });
      expect(pkg.bugs).toEqual({
        url: 'https://github.com/johndoe/test-package/issues',
      });
      expect(pkg.homepage).toBe('https://github.com/johndoe/test-package#readme');
    });

    it('should not add repository fields when GitHub username is missing', () => {
      const pkg = generatePackageJson(baseConfig);

      expect(pkg.repository).toBeUndefined();
      expect(pkg.bugs).toBeUndefined();
      expect(pkg.homepage).toBeUndefined();
    });
  });

  describe('module type', () => {
    it('should set type to "module" for ESM', () => {
      const config = { ...baseConfig, moduleType: 'esm' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.type).toBe('module');
    });

    it('should set type to "commonjs" for CommonJS', () => {
      const config = { ...baseConfig, moduleType: 'commonjs' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.type).toBe('commonjs');
    });

    it('should set type to "module" for dual format', () => {
      const config = { ...baseConfig, moduleType: 'dual' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.type).toBe('module');
    });
  });

  describe('TypeScript entry points', () => {
    it('should generate correct entry points for ESM', () => {
      const config = { ...baseConfig, moduleType: 'esm' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.main).toBe('./index.js');
      expect(pkg.types).toBe('./index.d.ts');
      expect(pkg.exports).toEqual({
        '.': {
          types: './index.d.ts',
          import: './index.js',
        },
      });
    });

    it('should generate correct entry points for CommonJS', () => {
      const config = { ...baseConfig, moduleType: 'commonjs' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.main).toBe('./index.js');
      expect(pkg.types).toBe('./index.d.ts');
      expect(pkg.exports).toEqual({
        '.': {
          types: './index.d.ts',
          require: './index.js',
        },
      });
    });

    it('should generate correct entry points for dual format', () => {
      const config = { ...baseConfig, moduleType: 'dual' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.main).toBe('./index.js');
      expect(pkg.module).toBe('./index.mjs');
      expect(pkg.types).toBe('./index.d.ts');
      expect(pkg.exports).toEqual({
        '.': {
          types: './index.d.ts',
          import: './index.mjs',
          require: './index.js',
        },
      });
    });
  });

  describe('JavaScript entry points', () => {
    it('should generate correct entry points for JavaScript ESM', () => {
      const config = {
        ...baseConfig,
        language: 'javascript' as const,
        moduleType: 'esm' as const,
      };
      const pkg = generatePackageJson(config);

      expect(pkg.main).toBe('./src/index.js');
      expect(pkg.module).toBe('./src/index.js');
      expect(pkg.exports).toEqual({
        '.': './src/index.js',
      });
      expect(pkg.types).toBeUndefined();
    });

    it('should generate correct entry points for JavaScript CommonJS', () => {
      const config = {
        ...baseConfig,
        language: 'javascript' as const,
        moduleType: 'commonjs' as const,
      };
      const pkg = generatePackageJson(config);

      expect(pkg.main).toBe('./src/index.js');
      expect(pkg.exports).toEqual({
        '.': './src/index.js',
      });
      expect(pkg.types).toBeUndefined();
      expect(pkg.module).toBeUndefined();
    });
  });

  describe('files array', () => {
    it('should include correct files for TypeScript ESM', () => {
      const config = { ...baseConfig, moduleType: 'esm' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.files).toEqual(['dist', 'index.js', 'index.d.ts']);
    });

    it('should include index.mjs for TypeScript dual format', () => {
      const config = { ...baseConfig, moduleType: 'dual' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.files).toEqual(['dist', 'index.js', 'index.d.ts', 'index.mjs']);
    });

    it('should only include src for JavaScript projects', () => {
      const config = { ...baseConfig, language: 'javascript' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.files).toEqual(['src']);
    });
  });

  describe('scripts', () => {
    it('should include build scripts for TypeScript', () => {
      const pkg = generatePackageJson(baseConfig);

      expect(pkg.scripts.build).toBe('tsup');
      expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
      expect(pkg.scripts['check:exports']).toBe('attw --pack');
      expect(pkg.scripts.prepublishOnly).toBe('npm run build');
    });

    it('should not include build scripts for JavaScript', () => {
      const config = { ...baseConfig, language: 'javascript' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.scripts.build).toBeUndefined();
      expect(pkg.scripts.typecheck).toBeUndefined();
      expect(pkg.scripts['check:exports']).toBeUndefined();
      expect(pkg.scripts.prepublishOnly).toBeUndefined();
    });

    it('should include Vitest scripts', () => {
      const config = { ...baseConfig, testRunner: 'vitest' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.scripts.test).toBe('vitest run');
      expect(pkg.scripts['test:watch']).toBe('vitest');
    });

    it('should include Jest scripts', () => {
      const config = { ...baseConfig, testRunner: 'jest' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.scripts.test).toBe('jest');
      expect(pkg.scripts['test:watch']).toBe('jest --watch');
    });

    it('should not include test scripts when testRunner is none', () => {
      const config = { ...baseConfig, testRunner: 'none' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.scripts.test).toBeUndefined();
      expect(pkg.scripts['test:watch']).toBeUndefined();
    });

    it('should include linting scripts when enabled', () => {
      const config = { ...baseConfig, useLinting: true };
      const pkg = generatePackageJson(config);

      expect(pkg.scripts.lint).toBe('eslint . --ext .ts');
      expect(pkg.scripts['lint:fix']).toBe('eslint . --ext .ts --fix');
      expect(pkg.scripts.format).toBe('prettier --write "src/**/*.{ts,js,json,md}"');
      expect(pkg.scripts['format:check']).toBe('prettier --check "src/**/*.{ts,js,json,md}"');
    });

    it('should include release script when using changesets', () => {
      const config = { ...baseConfig, useChangesets: true };
      const pkg = generatePackageJson(config);

      expect(pkg.scripts.release).toBe('changeset publish');
    });
  });

  describe('devDependencies', () => {
    it('should include TypeScript dependencies', () => {
      const pkg = generatePackageJson(baseConfig);

      expect(pkg.devDependencies.typescript).toBeDefined();
      expect(pkg.devDependencies.tsup).toBeDefined();
      expect(pkg.devDependencies['@types/node']).toBeDefined();
      expect(pkg.devDependencies['@arethetypeswrong/cli']).toBeDefined();
    });

    it('should include Vitest when selected', () => {
      const config = { ...baseConfig, testRunner: 'vitest' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.devDependencies.vitest).toBeDefined();
    });

    it('should include Jest dependencies when selected', () => {
      const config = { ...baseConfig, testRunner: 'jest' as const };
      const pkg = generatePackageJson(config);

      expect(pkg.devDependencies.jest).toBeDefined();
      expect(pkg.devDependencies['ts-jest']).toBeDefined();
      expect(pkg.devDependencies['@types/jest']).toBeDefined();
    });

    it('should include linting dependencies when enabled', () => {
      const config = { ...baseConfig, useLinting: true };
      const pkg = generatePackageJson(config);

      expect(pkg.devDependencies.eslint).toBeDefined();
      expect(pkg.devDependencies.prettier).toBeDefined();
      expect(pkg.devDependencies['eslint-config-prettier']).toBeDefined();
      expect(pkg.devDependencies['@typescript-eslint/eslint-plugin']).toBeDefined();
      expect(pkg.devDependencies['@typescript-eslint/parser']).toBeDefined();
    });

    it('should include changesets when enabled', () => {
      const config = { ...baseConfig, useChangesets: true };
      const pkg = generatePackageJson(config);

      expect(pkg.devDependencies['@changesets/cli']).toBeDefined();
    });

    it('should not include TypeScript-specific ESLint for JavaScript', () => {
      const config = {
        ...baseConfig,
        language: 'javascript' as const,
        useLinting: true,
      };
      const pkg = generatePackageJson(config);

      expect(pkg.devDependencies['@typescript-eslint/eslint-plugin']).toBeUndefined();
      expect(pkg.devDependencies['@typescript-eslint/parser']).toBeUndefined();
    });
  });
});
