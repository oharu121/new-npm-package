import { describe, it, expect } from 'vitest';
import { generateCIWorkflow } from './workflows';
import type { ProjectConfig } from './types';

describe('generateCIWorkflow', () => {
  it('should generate CI workflow with all steps for TypeScript project with tests and linting', () => {
    const config: ProjectConfig = {
      packageName: 'test-package',
      language: 'typescript',
      moduleType: 'esm',
      testRunner: 'vitest',
      useLinting: true,
      initGit: false,
      setupCI: true,
      setupCD: false,
      useCodecov: true, // Enable Codecov for this test
    };

    const workflow = generateCIWorkflow(config);

    expect(workflow).toContain('name: CI');
    expect(workflow).toContain('on:');
    expect(workflow).toContain('push:');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('matrix:');
    expect(workflow).toContain('node-version: [18, 20, 22]');
    expect(workflow).toContain('npm run typecheck');
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm test');
    expect(workflow).toContain('npm run build');
    expect(workflow).toContain('codecov');
  });

  it('should not include typecheck for JavaScript projects', () => {
    const config: ProjectConfig = {
      packageName: 'test-package',
      language: 'javascript',
      moduleType: 'esm',
      testRunner: 'vitest',
      useLinting: true,
      initGit: false,
      setupCI: true,
      setupCD: false,
    };

    const workflow = generateCIWorkflow(config);

    expect(workflow).not.toContain('npm run typecheck');
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm test');
  });

  it('should not include lint step when linting is disabled', () => {
    const config: ProjectConfig = {
      packageName: 'test-package',
      language: 'typescript',
      moduleType: 'esm',
      testRunner: 'vitest',
      useLinting: false,
      initGit: false,
      setupCI: true,
      setupCD: false,
    };

    const workflow = generateCIWorkflow(config);

    expect(workflow).not.toContain('npm run lint');
    expect(workflow).toContain('npm run typecheck');
    expect(workflow).toContain('npm test');
  });

  it('should not include test step when tests are disabled', () => {
    const config: ProjectConfig = {
      packageName: 'test-package',
      language: 'typescript',
      moduleType: 'esm',
      testRunner: 'none',
      useLinting: true,
      initGit: false,
      setupCI: true,
      setupCD: false,
      useCodecov: false,
    };

    const workflow = generateCIWorkflow(config);

    expect(workflow).not.toContain('npm test');
    expect(workflow).not.toContain('codecov');
    expect(workflow).toContain('npm run typecheck');
    expect(workflow).toContain('npm run build');
  });

  it('should not include Codecov when useCodecov is false', () => {
    const config: ProjectConfig = {
      packageName: 'test-package',
      language: 'typescript',
      moduleType: 'esm',
      testRunner: 'vitest',
      useLinting: true,
      initGit: false,
      setupCI: true,
      setupCD: false,
      useCodecov: false, // Explicitly disable Codecov
    };

    const workflow = generateCIWorkflow(config);

    expect(workflow).toContain('npm test');
    expect(workflow).not.toContain('codecov');
    expect(workflow).toContain('npm run build');
  });
});
