/**
 * User configuration storage utilities
 * Stores user preferences in OS-appropriate config directory
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { dirname } from "path";
import { mkdir } from "fs/promises";
import envPaths from "env-paths";

const paths = envPaths("new-npm-package", { suffix: "" });
const CONFIG_PATH = `${paths.config}/config.json`;

export interface UserConfig {
  author?: string;
  email?: string;
  github?: string;
}

/**
 * Read stored user configuration
 */
export function readUserConfig(): UserConfig | null {
  try {
    if (!existsSync(CONFIG_PATH)) {
      return null;
    }
    const data = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If config is corrupted, return null
    return null;
  }
}

/**
 * Write user configuration to disk
 */
export async function writeUserConfig(config: UserConfig): Promise<void> {
  try {
    // Ensure config directory exists
    await mkdir(dirname(CONFIG_PATH), { recursive: true });

    // Write config file
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to save config: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Delete stored user configuration
 */
export function resetUserConfig(): boolean {
  try {
    if (existsSync(CONFIG_PATH)) {
      unlinkSync(CONFIG_PATH);
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(
      `Failed to reset config: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Get the config file path (for display purposes)
 */
export function getConfigPath(): string {
  return CONFIG_PATH;
}
