/**
 * E2E tests for forge-npm-pkg CLI
 *
 * These tests verify the entire CLI workflow:
 * 1. Generate a project with default settings (--skip-install for speed)
 * 2. Verify project structure and all required files exist
 *
 * Note: We skip npm install for performance. Use dev:test:full for full validation.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { rmSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";

// Use relative path like dev:test scripts
const TEST_PACKAGE_PATH_RELATIVE = ".test-output/test-package";
const TEST_PACKAGE_PATH_ABSOLUTE = join(
  process.cwd(),
  TEST_PACKAGE_PATH_RELATIVE
);

describe("E2E: CLI generates working project", () => {
  beforeAll(() => {
    // Clean up any previous test output
    if (existsSync(TEST_PACKAGE_PATH_ABSOLUTE)) {
      rmSync(TEST_PACKAGE_PATH_ABSOLUTE, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    // Optional: Keep test output for inspection
    // Comment out to preserve generated project
    if (existsSync(TEST_PACKAGE_PATH_ABSOLUTE)) {
      rmSync(TEST_PACKAGE_PATH_ABSOLUTE, { recursive: true, force: true });
    }
  });

  it("should generate project with -y flag", () => {
    // Pass relative path to CLI (like dev:test does)
    // Use --skip-install for faster generation, we'll install manually after
    execSync(
      `node dist/index.js ${TEST_PACKAGE_PATH_RELATIVE} -y --skip-install`,
      {
        stdio: "pipe",
        cwd: process.cwd(),
      }
    );

    expect(existsSync(TEST_PACKAGE_PATH_ABSOLUTE)).toBe(true);
  }, 60000); // 60s timeout for project generation

  it("should generate all required files", () => {
    const requiredFiles = [
      "package.json",
      "README.md",
      ".gitignore",
      "tsconfig.json",
      "tsup.config.ts",
      "vitest.config.ts",
      "index.js",
      "index.d.ts",
      ".eslintrc.json",
      ".prettierrc",
      ".editorconfig",
      "src/index.ts",
      "src/index.test.ts",
    ];

    for (const file of requiredFiles) {
      const filePath = join(TEST_PACKAGE_PATH_ABSOLUTE, file);
      expect(existsSync(filePath), `Expected ${file} to exist`).toBe(true);
    }
  });
});
