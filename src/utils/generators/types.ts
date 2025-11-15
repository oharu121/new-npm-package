/**
 * Type definitions for project configuration
 */

export interface ProjectConfig {
  packageName: string;
  language: 'typescript' | 'javascript';
  moduleType: 'esm' | 'commonjs' | 'dual';
  testRunner: 'vitest' | 'jest' | 'none';
  useLinting: boolean;
  initGit: boolean;
  setupCI?: boolean;
  setupCD?: boolean;
  useCodecov?: boolean;
  useDependabot?: boolean;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  description?: string;
  author?: string;
  authorEmail?: string;
  githubUsername?: string;
}
