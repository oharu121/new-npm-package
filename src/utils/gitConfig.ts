/**
 * Git configuration reader utilities
 * Reads user.name and user.email from git config
 */

import { execSync } from 'child_process';

export interface GitConfig {
  name?: string;
  email?: string;
}

/**
 * Try to read git user.name and user.email
 * Returns null if git is not installed or config is not set
 */
export function readGitConfig(): GitConfig | null {
  try {
    const name = execSync('git config --global user.name', {
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();

    const email = execSync('git config --global user.email', {
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();

    // Only return if at least one value is set
    if (name || email) {
      return {
        name: name || undefined,
        email: email || undefined,
      };
    }

    return null;
  } catch (error) {
    // Git not installed or config not set
    return null;
  }
}

/**
 * Format git config for display
 */
export function formatGitConfig(config: GitConfig): string {
  if (!config.name && !config.email) {
    return '';
  }

  if (config.name && config.email) {
    return `${config.name} <${config.email}>`;
  }

  return config.name || config.email || '';
}
