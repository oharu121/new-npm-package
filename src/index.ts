#!/usr/bin/env node

import { Command } from "commander";
import * as clack from "@clack/prompts";
import updateNotifier from "update-notifier";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import {
  type ProjectConfig,
  generatePackageJson,
  generateTsConfig,
  generateTsupConfig,
  generateEslintConfig,
  generatePrettierConfig,
  generateVitestConfig,
  generateJestConfig,
  generateReadme,
  generateGitignore,
  generateNpmignore,
  generateEditorConfig,
  generateRootIndexJs,
  generateRootIndexMjs,
  generateRootIndexDts,
  generateCIWorkflow,
  generateDependabotConfig,
} from "./utils/generators/index.js";
import {
  readUserConfig,
  writeUserConfig,
  resetUserConfig,
  getConfigPath,
} from "./utils/userConfig.js";
import { readGitConfig, formatGitConfig } from "./utils/gitConfig.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get package version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);
const VERSION = packageJson.version;

// Check for updates (non-blocking, cached once per day)
updateNotifier({
  pkg: packageJson,
  updateCheckInterval: 1000 * 60 * 60 * 24 // Check once per day
}).notify({
  isGlobal: true,
  defer: false
});

// Constants
const INITIAL_COMMIT_MESSAGE = "chore: initial commit";
const NPM_NAME_MAX_LENGTH = 214;

/**
 * Helper function to handle cancellation
 */
function handleCancel<T>(
  value: T | symbol,
  message = "Operation cancelled"
): T {
  if (clack.isCancel(value)) {
    clack.cancel(message);
    process.exit(0);
  }
  return value as T;
}

/**
 * Validates package name according to npm rules
 */
function validatePackageName(name: string): string | undefined {
  if (!name) return "Package name is required";
  if (name.length > NPM_NAME_MAX_LENGTH) {
    return `Package name must be ${NPM_NAME_MAX_LENGTH} characters or less`;
  }

  // Check for scoped package
  const scopedPackagePattern =
    /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
  if (!scopedPackagePattern.test(name)) {
    return "Package name must be lowercase and can only contain letters, numbers, hyphens, underscores, and @/ for scoped packages";
  }

  // Reserved names
  const reserved = ["node_modules", "favicon.ico"];
  if (reserved.includes(name)) {
    return `"${name}" is a reserved package name`;
  }

  return undefined;
}

/**
 * Check if package name is available on npm
 */
async function checkPackageAvailability(packageName: string): Promise<boolean> {
  try {
    execSync(`npm view ${packageName}`, { stdio: "pipe" });
    return false; // Package exists
  } catch {
    return true; // Package doesn't exist (404)
  }
}

const program = new Command();

program
  .name("forge-npm-pkg")
  .description("Scaffold a production-ready npm package")
  .argument("[package-name]", "Name of the package to create")
  .option(
    "-y, --yes",
    "Skip prompts and use recommended defaults (TypeScript + Vitest + Linting)"
  )
  .option("--dry-run", "Show what would be generated without creating files")
  .option("--skip-install", "Skip dependency installation")
  .option(
    "--no-save",
    "Don't offer to save user information for future projects"
  )
  .option("--reset-config", "Reset stored user configuration")
  .option("--config", "Show current stored configuration")
  .option("--typescript", "Use TypeScript")
  .option("--javascript", "Use JavaScript")
  .option("--vitest", "Use Vitest for testing")
  .option("--jest", "Use Jest for testing")
  .option("--no-tests", "Skip testing setup")
  .option("--no-lint", "Skip ESLint + Prettier setup")
  .option("--no-git", "Skip git initialization")
  .action(async (packageName?: string, options?: any) => {
    console.clear();

    // Display logo banner
    console.log(
      "\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m█\x1b[39m\x1b[38;2;241;187;53m█\x1b[39m\x1b[38;2;238;187;56m█\x1b[39m\x1b[38;2;234;188;58m█\x1b[39m\x1b[38;2;230;188;61m█\x1b[39m\x1b[38;2;226;188;63m╗\x1b[39m\x1b[38;2;222;188;66m \x1b[39m\x1b[38;2;218;188;69m█\x1b[39m\x1b[38;2;215;188;71m█\x1b[39m\x1b[38;2;211;188;74m█\x1b[39m\x1b[38;2;207;188;77m█\x1b[39m\x1b[38;2;203;188;79m█\x1b[39m\x1b[38;2;199;188;82m█\x1b[39m\x1b[38;2;195;189;84m╗\x1b[39m\x1b[38;2;192;189;87m \x1b[39m\x1b[38;2;188;189;90m█\x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m█\x1b[39m\x1b[38;2;176;189;98m█\x1b[39m\x1b[38;2;172;189;100m█\x1b[39m\x1b[38;2;168;189;103m█\x1b[39m\x1b[38;2;165;189;106m╗\x1b[39m\x1b[38;2;161;190;108m \x1b[39m\x1b[38;2;157;190;111m \x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m█\x1b[39m\x1b[38;2;145;190;119m█\x1b[39m\x1b[38;2;142;190;121m█\x1b[39m\x1b[38;2;138;190;124m█\x1b[39m\x1b[38;2;134;190;127m█\x1b[39m\x1b[38;2;130;190;129m╗\x1b[39m\x1b[38;2;126;190;132m \x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m█\x1b[39m\x1b[38;2;115;191;140m█\x1b[39m\x1b[38;2;111;191;142m█\x1b[39m\x1b[38;2;107;191;145m█\x1b[39m\x1b[38;2;103;191;148m█\x1b[39m\x1b[38;2;99;191;150m█\x1b[39m\x1b[38;2;95;191;153m╗\x1b[39m\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m╔\x1b[39m\x1b[38;2;241;187;53m═\x1b[39m\x1b[38;2;238;187;56m═\x1b[39m\x1b[38;2;234;188;58m═\x1b[39m\x1b[38;2;230;188;61m═\x1b[39m\x1b[38;2;226;188;63m╝\x1b[39m\x1b[38;2;222;188;66m█\x1b[39m\x1b[38;2;218;188;69m█\x1b[39m\x1b[38;2;215;188;71m╔\x1b[39m\x1b[38;2;211;188;74m═\x1b[39m\x1b[38;2;207;188;77m═\x1b[39m\x1b[38;2;203;188;79m═\x1b[39m\x1b[38;2;199;188;82m█\x1b[39m\x1b[38;2;195;189;84m█\x1b[39m\x1b[38;2;192;189;87m╗\x1b[39m\x1b[38;2;188;189;90m█\x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m╔\x1b[39m\x1b[38;2;176;189;98m═\x1b[39m\x1b[38;2;172;189;100m═\x1b[39m\x1b[38;2;168;189;103m█\x1b[39m\x1b[38;2;165;189;106m█\x1b[39m\x1b[38;2;161;190;108m╗\x1b[39m\x1b[38;2;157;190;111m█\x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m╔\x1b[39m\x1b[38;2;145;190;119m═\x1b[39m\x1b[38;2;142;190;121m═\x1b[39m\x1b[38;2;138;190;124m═\x1b[39m\x1b[38;2;134;190;127m═\x1b[39m\x1b[38;2;130;190;129m╝\x1b[39m\x1b[38;2;126;190;132m \x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m█\x1b[39m\x1b[38;2;115;191;140m╔\x1b[39m\x1b[38;2;111;191;142m═\x1b[39m\x1b[38;2;107;191;145m═\x1b[39m\x1b[38;2;103;191;148m═\x1b[39m\x1b[38;2;99;191;150m═\x1b[39m\x1b[38;2;95;191;153m╝\x1b[39m\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m█\x1b[39m\x1b[38;2;241;187;53m█\x1b[39m\x1b[38;2;238;187;56m█\x1b[39m\x1b[38;2;234;188;58m╗\x1b[39m\x1b[38;2;230;188;61m \x1b[39m\x1b[38;2;226;188;63m \x1b[39m\x1b[38;2;222;188;66m█\x1b[39m\x1b[38;2;218;188;69m█\x1b[39m\x1b[38;2;215;188;71m║\x1b[39m\x1b[38;2;211;188;74m \x1b[39m\x1b[38;2;207;188;77m \x1b[39m\x1b[38;2;203;188;79m \x1b[39m\x1b[38;2;199;188;82m█\x1b[39m\x1b[38;2;195;189;84m█\x1b[39m\x1b[38;2;192;189;87m║\x1b[39m\x1b[38;2;188;189;90m█\x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m█\x1b[39m\x1b[38;2;176;189;98m█\x1b[39m\x1b[38;2;172;189;100m█\x1b[39m\x1b[38;2;168;189;103m█\x1b[39m\x1b[38;2;165;189;106m╔\x1b[39m\x1b[38;2;161;190;108m╝\x1b[39m\x1b[38;2;157;190;111m█\x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m║\x1b[39m\x1b[38;2;145;190;119m \x1b[39m\x1b[38;2;142;190;121m \x1b[39m\x1b[38;2;138;190;124m█\x1b[39m\x1b[38;2;134;190;127m█\x1b[39m\x1b[38;2;130;190;129m█\x1b[39m\x1b[38;2;126;190;132m╗\x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m█\x1b[39m\x1b[38;2;115;191;140m█\x1b[39m\x1b[38;2;111;191;142m█\x1b[39m\x1b[38;2;107;191;145m█\x1b[39m\x1b[38;2;103;191;148m╗\x1b[39m\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m╔\x1b[39m\x1b[38;2;241;187;53m═\x1b[39m\x1b[38;2;238;187;56m═\x1b[39m\x1b[38;2;234;188;58m╝\x1b[39m\x1b[38;2;230;188;61m \x1b[39m\x1b[38;2;226;188;63m \x1b[39m\x1b[38;2;222;188;66m█\x1b[39m\x1b[38;2;218;188;69m█\x1b[39m\x1b[38;2;215;188;71m║\x1b[39m\x1b[38;2;211;188;74m \x1b[39m\x1b[38;2;207;188;77m \x1b[39m\x1b[38;2;203;188;79m \x1b[39m\x1b[38;2;199;188;82m█\x1b[39m\x1b[38;2;195;189;84m█\x1b[39m\x1b[38;2;192;189;87m║\x1b[39m\x1b[38;2;188;189;90m█\x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m╔\x1b[39m\x1b[38;2;176;189;98m═\x1b[39m\x1b[38;2;172;189;100m═\x1b[39m\x1b[38;2;168;189;103m█\x1b[39m\x1b[38;2;165;189;106m█\x1b[39m\x1b[38;2;161;190;108m╗\x1b[39m\x1b[38;2;157;190;111m█\x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m║\x1b[39m\x1b[38;2;145;190;119m \x1b[39m\x1b[38;2;142;190;121m \x1b[39m\x1b[38;2;138;190;124m \x1b[39m\x1b[38;2;134;190;127m█\x1b[39m\x1b[38;2;130;190;129m█\x1b[39m\x1b[38;2;126;190;132m║\x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m█\x1b[39m\x1b[38;2;115;191;140m╔\x1b[39m\x1b[38;2;111;191;142m═\x1b[39m\x1b[38;2;107;191;145m═\x1b[39m\x1b[38;2;103;191;148m╝\x1b[39m\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m║\x1b[39m\x1b[38;2;241;187;53m \x1b[39m\x1b[38;2;238;187;56m \x1b[39m\x1b[38;2;234;188;58m \x1b[39m\x1b[38;2;230;188;61m \x1b[39m\x1b[38;2;226;188;63m \x1b[39m\x1b[38;2;222;188;66m╚\x1b[39m\x1b[38;2;218;188;69m█\x1b[39m\x1b[38;2;215;188;71m█\x1b[39m\x1b[38;2;211;188;74m█\x1b[39m\x1b[38;2;207;188;77m█\x1b[39m\x1b[38;2;203;188;79m█\x1b[39m\x1b[38;2;199;188;82m█\x1b[39m\x1b[38;2;195;189;84m╔\x1b[39m\x1b[38;2;192;189;87m╝\x1b[39m\x1b[38;2;188;189;90m█\x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m║\x1b[39m\x1b[38;2;176;189;98m \x1b[39m\x1b[38;2;172;189;100m \x1b[39m\x1b[38;2;168;189;103m█\x1b[39m\x1b[38;2;165;189;106m█\x1b[39m\x1b[38;2;161;190;108m║\x1b[39m\x1b[38;2;157;190;111m╚\x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m█\x1b[39m\x1b[38;2;145;190;119m█\x1b[39m\x1b[38;2;142;190;121m█\x1b[39m\x1b[38;2;138;190;124m█\x1b[39m\x1b[38;2;134;190;127m█\x1b[39m\x1b[38;2;130;190;129m╔\x1b[39m\x1b[38;2;126;190;132m╝\x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m█\x1b[39m\x1b[38;2;115;191;140m█\x1b[39m\x1b[38;2;111;191;142m█\x1b[39m\x1b[38;2;107;191;145m█\x1b[39m\x1b[38;2;103;191;148m█\x1b[39m\x1b[38;2;99;191;150m█\x1b[39m\x1b[38;2;95;191;153m╗\x1b[39m\n" +
        "\x1b[38;2;253;187;45m╚\x1b[39m\x1b[38;2;249;187;48m═\x1b[39m\x1b[38;2;245;187;50m╝\x1b[39m\x1b[38;2;241;187;53m \x1b[39m\x1b[38;2;238;187;56m \x1b[39m\x1b[38;2;234;188;58m \x1b[39m\x1b[38;2;230;188;61m \x1b[39m\x1b[38;2;226;188;63m \x1b[39m\x1b[38;2;222;188;66m \x1b[39m\x1b[38;2;218;188;69m╚\x1b[39m\x1b[38;2;215;188;71m═\x1b[39m\x1b[38;2;211;188;74m═\x1b[39m\x1b[38;2;207;188;77m═\x1b[39m\x1b[38;2;203;188;79m═\x1b[39m\x1b[38;2;199;188;82m═\x1b[39m\x1b[38;2;195;189;84m╝\x1b[39m\x1b[38;2;192;189;87m \x1b[39m\x1b[38;2;188;189;90m╚\x1b[39m\x1b[38;2;184;189;92m═\x1b[39m\x1b[38;2;180;189;95m╝\x1b[39m\x1b[38;2;176;189;98m \x1b[39m\x1b[38;2;172;189;100m \x1b[39m\x1b[38;2;168;189;103m╚\x1b[39m\x1b[38;2;165;189;106m═\x1b[39m\x1b[38;2;161;190;108m╝\x1b[39m\x1b[38;2;157;190;111m \x1b[39m\x1b[38;2;153;190;113m╚\x1b[39m\x1b[38;2;149;190;116m═\x1b[39m\x1b[38;2;145;190;119m═\x1b[39m\x1b[38;2;142;190;121m═\x1b[39m\x1b[38;2;138;190;124m═\x1b[39m\x1b[38;2;134;190;127m═\x1b[39m\x1b[38;2;130;190;129m╝\x1b[39m\x1b[38;2;126;190;132m \x1b[39m\x1b[38;2;122;191;134m╚\x1b[39m\x1b[38;2;119;191;137m═\x1b[39m\x1b[38;2;115;191;140m═\x1b[39m\x1b[38;2;111;191;142m═\x1b[39m\x1b[38;2;107;191;145m═\x1b[39m\x1b[38;2;103;191;148m═\x1b[39m\x1b[38;2;99;191;150m═\x1b[39m\x1b[38;2;95;191;153m╝\x1b[39m\n" +
        "\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m█\x1b[39m\x1b[38;2;241;187;53m╗\x1b[39m\x1b[38;2;238;187;56m \x1b[39m\x1b[38;2;234;188;58m \x1b[39m\x1b[38;2;230;188;61m \x1b[39m\x1b[38;2;226;188;63m█\x1b[39m\x1b[38;2;222;188;66m█\x1b[39m\x1b[38;2;218;188;69m╗\x1b[39m\x1b[38;2;215;188;71m█\x1b[39m\x1b[38;2;211;188;74m█\x1b[39m\x1b[38;2;207;188;77m█\x1b[39m\x1b[38;2;203;188;79m█\x1b[39m\x1b[38;2;199;188;82m█\x1b[39m\x1b[38;2;195;189;84m█\x1b[39m\x1b[38;2;192;189;87m╗\x1b[39m\x1b[38;2;188;189;90m \x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m█\x1b[39m\x1b[38;2;176;189;98m█\x1b[39m\x1b[38;2;172;189;100m╗\x1b[39m\x1b[38;2;168;189;103m \x1b[39m\x1b[38;2;165;189;106m \x1b[39m\x1b[38;2;161;190;108m \x1b[39m\x1b[38;2;157;190;111m█\x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m█\x1b[39m\x1b[38;2;145;190;119m╗\x1b[39m\x1b[38;2;142;190;121m \x1b[39m\x1b[38;2;138;190;124m \x1b[39m\x1b[38;2;134;190;127m \x1b[39m\x1b[38;2;130;190;129m \x1b[39m\x1b[38;2;126;190;132m█\x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m█\x1b[39m\x1b[38;2;115;191;140m█\x1b[39m\x1b[38;2;111;191;142m█\x1b[39m\x1b[38;2;107;191;145m█\x1b[39m\x1b[38;2;103;191;148m╗\x1b[39m\x1b[38;2;99;191;150m \x1b[39m\x1b[38;2;95;191;153m█\x1b[39m\x1b[38;2;92;191;156m█\x1b[39m\x1b[38;2;88;192;158m╗\x1b[39m\x1b[38;2;84;192;161m \x1b[39m\x1b[38;2;80;192;163m \x1b[39m\x1b[38;2;76;192;166m█\x1b[39m\x1b[38;2;72;192;169m█\x1b[39m\x1b[38;2;69;192;171m╗\x1b[39m\x1b[38;2;65;192;174m \x1b[39m\x1b[38;2;61;192;177m█\x1b[39m\x1b[38;2;57;192;179m█\x1b[39m\x1b[38;2;53;192;182m█\x1b[39m\x1b[38;2;49;193;184m█\x1b[39m\x1b[38;2;46;193;187m█\x1b[39m\x1b[38;2;42;193;190m█\x1b[39m\x1b[38;2;38;193;192m╗\x1b[39m\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m█\x1b[39m\x1b[38;2;241;187;53m█\x1b[39m\x1b[38;2;238;187;56m╗\x1b[39m\x1b[38;2;234;188;58m \x1b[39m\x1b[38;2;230;188;61m \x1b[39m\x1b[38;2;226;188;63m█\x1b[39m\x1b[38;2;222;188;66m█\x1b[39m\x1b[38;2;218;188;69m║\x1b[39m\x1b[38;2;215;188;71m█\x1b[39m\x1b[38;2;211;188;74m█\x1b[39m\x1b[38;2;207;188;77m╔\x1b[39m\x1b[38;2;203;188;79m═\x1b[39m\x1b[38;2;199;188;82m═\x1b[39m\x1b[38;2;195;189;84m█\x1b[39m\x1b[38;2;192;189;87m█\x1b[39m\x1b[38;2;188;189;90m╗\x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m█\x1b[39m\x1b[38;2;176;189;98m█\x1b[39m\x1b[38;2;172;189;100m█\x1b[39m\x1b[38;2;168;189;103m╗\x1b[39m\x1b[38;2;165;189;106m \x1b[39m\x1b[38;2;161;190;108m█\x1b[39m\x1b[38;2;157;190;111m█\x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m█\x1b[39m\x1b[38;2;145;190;119m║\x1b[39m\x1b[38;2;142;190;121m \x1b[39m\x1b[38;2;138;190;124m \x1b[39m\x1b[38;2;134;190;127m \x1b[39m\x1b[38;2;130;190;129m \x1b[39m\x1b[38;2;126;190;132m█\x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m╔\x1b[39m\x1b[38;2;115;191;140m═\x1b[39m\x1b[38;2;111;191;142m═\x1b[39m\x1b[38;2;107;191;145m█\x1b[39m\x1b[38;2;103;191;148m█\x1b[39m\x1b[38;2;99;191;150m╗\x1b[39m\x1b[38;2;95;191;153m█\x1b[39m\x1b[38;2;92;191;156m█\x1b[39m\x1b[38;2;88;192;158m║\x1b[39m\x1b[38;2;84;192;161m \x1b[39m\x1b[38;2;80;192;163m█\x1b[39m\x1b[38;2;76;192;166m█\x1b[39m\x1b[38;2;72;192;169m╔\x1b[39m\x1b[38;2;69;192;171m╝\x1b[39m\x1b[38;2;65;192;174m█\x1b[39m\x1b[38;2;61;192;177m█\x1b[39m\x1b[38;2;57;192;179m╔\x1b[39m\x1b[38;2;53;192;182m═\x1b[39m\x1b[38;2;49;193;184m═\x1b[39m\x1b[38;2;46;193;187m═\x1b[39m\x1b[38;2;42;193;190m═\x1b[39m\x1b[38;2;38;193;192m╝\x1b[39m\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m╔\x1b[39m\x1b[38;2;241;187;53m█\x1b[39m\x1b[38;2;238;187;56m█\x1b[39m\x1b[38;2;234;188;58m╗\x1b[39m\x1b[38;2;230;188;61m \x1b[39m\x1b[38;2;226;188;63m█\x1b[39m\x1b[38;2;222;188;66m█\x1b[39m\x1b[38;2;218;188;69m║\x1b[39m\x1b[38;2;215;188;71m█\x1b[39m\x1b[38;2;211;188;74m█\x1b[39m\x1b[38;2;207;188;77m█\x1b[39m\x1b[38;2;203;188;79m█\x1b[39m\x1b[38;2;199;188;82m█\x1b[39m\x1b[38;2;195;189;84m█\x1b[39m\x1b[38;2;192;189;87m╔\x1b[39m\x1b[38;2;188;189;90m╝\x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m█\x1b[39m\x1b[38;2;176;189;98m╔\x1b[39m\x1b[38;2;172;189;100m█\x1b[39m\x1b[38;2;168;189;103m█\x1b[39m\x1b[38;2;165;189;106m█\x1b[39m\x1b[38;2;161;190;108m█\x1b[39m\x1b[38;2;157;190;111m╔\x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m█\x1b[39m\x1b[38;2;145;190;119m║\x1b[39m\x1b[38;2;142;190;121m \x1b[39m\x1b[38;2;138;190;124m \x1b[39m\x1b[38;2;134;190;127m \x1b[39m\x1b[38;2;130;190;129m \x1b[39m\x1b[38;2;126;190;132m█\x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m█\x1b[39m\x1b[38;2;115;191;140m█\x1b[39m\x1b[38;2;111;191;142m█\x1b[39m\x1b[38;2;107;191;145m█\x1b[39m\x1b[38;2;103;191;148m╔\x1b[39m\x1b[38;2;99;191;150m╝\x1b[39m\x1b[38;2;95;191;153m█\x1b[39m\x1b[38;2;92;191;156m█\x1b[39m\x1b[38;2;88;192;158m█\x1b[39m\x1b[38;2;84;192;161m█\x1b[39m\x1b[38;2;80;192;163m█\x1b[39m\x1b[38;2;76;192;166m╔\x1b[39m\x1b[38;2;72;192;169m╝\x1b[39m\x1b[38;2;69;192;171m \x1b[39m\x1b[38;2;65;192;174m█\x1b[39m\x1b[38;2;61;192;177m█\x1b[39m\x1b[38;2;57;192;179m║\x1b[39m\x1b[38;2;53;192;182m \x1b[39m\x1b[38;2;49;193;184m \x1b[39m\x1b[38;2;46;193;187m█\x1b[39m\x1b[38;2;42;193;190m█\x1b[39m\x1b[38;2;38;193;192m█\x1b[39m\x1b[38;2;34;193;195m╗\x1b[39m\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m║\x1b[39m\x1b[38;2;241;187;53m╚\x1b[39m\x1b[38;2;238;187;56m█\x1b[39m\x1b[38;2;234;188;58m█\x1b[39m\x1b[38;2;230;188;61m╗\x1b[39m\x1b[38;2;226;188;63m█\x1b[39m\x1b[38;2;222;188;66m█\x1b[39m\x1b[38;2;218;188;69m║\x1b[39m\x1b[38;2;215;188;71m█\x1b[39m\x1b[38;2;211;188;74m█\x1b[39m\x1b[38;2;207;188;77m╔\x1b[39m\x1b[38;2;203;188;79m═\x1b[39m\x1b[38;2;199;188;82m═\x1b[39m\x1b[38;2;195;189;84m═\x1b[39m\x1b[38;2;192;189;87m╝\x1b[39m\x1b[38;2;188;189;90m \x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m█\x1b[39m\x1b[38;2;176;189;98m║\x1b[39m\x1b[38;2;172;189;100m╚\x1b[39m\x1b[38;2;168;189;103m█\x1b[39m\x1b[38;2;165;189;106m█\x1b[39m\x1b[38;2;161;190;108m╔\x1b[39m\x1b[38;2;157;190;111m╝\x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m█\x1b[39m\x1b[38;2;145;190;119m║\x1b[39m\x1b[38;2;142;190;121m \x1b[39m\x1b[38;2;138;190;124m \x1b[39m\x1b[38;2;134;190;127m \x1b[39m\x1b[38;2;130;190;129m \x1b[39m\x1b[38;2;126;190;132m█\x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m╔\x1b[39m\x1b[38;2;115;191;140m═\x1b[39m\x1b[38;2;111;191;142m═\x1b[39m\x1b[38;2;107;191;145m═\x1b[39m\x1b[38;2;103;191;148m╝\x1b[39m\x1b[38;2;99;191;150m \x1b[39m\x1b[38;2;95;191;153m█\x1b[39m\x1b[38;2;92;191;156m█\x1b[39m\x1b[38;2;88;192;158m╔\x1b[39m\x1b[38;2;84;192;161m═\x1b[39m\x1b[38;2;80;192;163m█\x1b[39m\x1b[38;2;76;192;166m█\x1b[39m\x1b[38;2;72;192;169m╗\x1b[39m\x1b[38;2;69;192;171m \x1b[39m\x1b[38;2;65;192;174m█\x1b[39m\x1b[38;2;61;192;177m█\x1b[39m\x1b[38;2;57;192;179m║\x1b[39m\x1b[38;2;53;192;182m \x1b[39m\x1b[38;2;49;193;184m \x1b[39m\x1b[38;2;46;193;187m \x1b[39m\x1b[38;2;42;193;190m█\x1b[39m\x1b[38;2;38;193;192m█\x1b[39m\x1b[38;2;34;193;195m║\x1b[39m\n" +
        "\x1b[38;2;253;187;45m█\x1b[39m\x1b[38;2;249;187;48m█\x1b[39m\x1b[38;2;245;187;50m║\x1b[39m\x1b[38;2;241;187;53m \x1b[39m\x1b[38;2;238;187;56m╚\x1b[39m\x1b[38;2;234;188;58m█\x1b[39m\x1b[38;2;230;188;61m█\x1b[39m\x1b[38;2;226;188;63m█\x1b[39m\x1b[38;2;222;188;66m█\x1b[39m\x1b[38;2;218;188;69m║\x1b[39m\x1b[38;2;215;188;71m█\x1b[39m\x1b[38;2;211;188;74m█\x1b[39m\x1b[38;2;207;188;77m║\x1b[39m\x1b[38;2;203;188;79m \x1b[39m\x1b[38;2;199;188;82m \x1b[39m\x1b[38;2;195;189;84m \x1b[39m\x1b[38;2;192;189;87m \x1b[39m\x1b[38;2;188;189;90m \x1b[39m\x1b[38;2;184;189;92m█\x1b[39m\x1b[38;2;180;189;95m█\x1b[39m\x1b[38;2;176;189;98m║\x1b[39m\x1b[38;2;172;189;100m \x1b[39m\x1b[38;2;168;189;103m╚\x1b[39m\x1b[38;2;165;189;106m═\x1b[39m\x1b[38;2;161;190;108m╝\x1b[39m\x1b[38;2;157;190;111m \x1b[39m\x1b[38;2;153;190;113m█\x1b[39m\x1b[38;2;149;190;116m█\x1b[39m\x1b[38;2;145;190;119m║\x1b[39m\x1b[38;2;142;190;121m \x1b[39m\x1b[38;2;138;190;124m \x1b[39m\x1b[38;2;134;190;127m \x1b[39m\x1b[38;2;130;190;129m \x1b[39m\x1b[38;2;126;190;132m█\x1b[39m\x1b[38;2;122;191;134m█\x1b[39m\x1b[38;2;119;191;137m║\x1b[39m\x1b[38;2;115;191;140m \x1b[39m\x1b[38;2;111;191;142m \x1b[39m\x1b[38;2;107;191;145m \x1b[39m\x1b[38;2;103;191;148m \x1b[39m\x1b[38;2;99;191;150m \x1b[39m\x1b[38;2;95;191;153m█\x1b[39m\x1b[38;2;92;191;156m█\x1b[39m\x1b[38;2;88;192;158m║\x1b[39m\x1b[38;2;84;192;161m \x1b[39m\x1b[38;2;80;192;163m \x1b[39m\x1b[38;2;76;192;166m█\x1b[39m\x1b[38;2;72;192;169m█\x1b[39m\x1b[38;2;69;192;171m╗\x1b[39m\x1b[38;2;65;192;174m╚\x1b[39m\x1b[38;2;61;192;177m█\x1b[39m\x1b[38;2;57;192;179m█\x1b[39m\x1b[38;2;53;192;182m█\x1b[39m\x1b[38;2;49;193;184m█\x1b[39m\x1b[38;2;46;193;187m█\x1b[39m\x1b[38;2;42;193;190m█\x1b[39m\x1b[38;2;38;193;192m╔\x1b[39m\x1b[38;2;34;193;195m╝\x1b[39m\n" +
        "\x1b[38;2;253;187;45m╚\x1b[39m\x1b[38;2;249;187;48m═\x1b[39m\x1b[38;2;245;187;50m╝\x1b[39m\x1b[38;2;241;187;53m \x1b[39m\x1b[38;2;238;187;56m \x1b[39m\x1b[38;2;234;188;58m╚\x1b[39m\x1b[38;2;230;188;61m═\x1b[39m\x1b[38;2;226;188;63m═\x1b[39m\x1b[38;2;222;188;66m═\x1b[39m\x1b[38;2;218;188;69m╝\x1b[39m\x1b[38;2;215;188;71m╚\x1b[39m\x1b[38;2;211;188;74m═\x1b[39m\x1b[38;2;207;188;77m╝\x1b[39m\x1b[38;2;203;188;79m \x1b[39m\x1b[38;2;199;188;82m \x1b[39m\x1b[38;2;195;189;84m \x1b[39m\x1b[38;2;192;189;87m \x1b[39m\x1b[38;2;188;189;90m \x1b[39m\x1b[38;2;184;189;92m╚\x1b[39m\x1b[38;2;180;189;95m═\x1b[39m\x1b[38;2;176;189;98m╝\x1b[39m\x1b[38;2;172;189;100m \x1b[39m\x1b[38;2;168;189;103m \x1b[39m\x1b[38;2;165;189;106m \x1b[39m\x1b[38;2;161;190;108m \x1b[39m\x1b[38;2;157;190;111m \x1b[39m\x1b[38;2;153;190;113m╚\x1b[39m\x1b[38;2;149;190;116m═\x1b[39m\x1b[38;2;145;190;119m╝\x1b[39m\x1b[38;2;142;190;121m \x1b[39m\x1b[38;2;138;190;124m \x1b[39m\x1b[38;2;134;190;127m \x1b[39m\x1b[38;2;130;190;129m \x1b[39m\x1b[38;2;126;190;132m╚\x1b[39m\x1b[38;2;122;191;134m═\x1b[39m\x1b[38;2;119;191;137m╝\x1b[39m\x1b[38;2;115;191;140m \x1b[39m\x1b[38;2;111;191;142m \x1b[39m\x1b[38;2;107;191;145m \x1b[39m\x1b[38;2;103;191;148m \x1b[39m\x1b[38;2;99;191;150m \x1b[39m\x1b[38;2;95;191;153m╚\x1b[39m\x1b[38;2;92;191;156m═\x1b[39m\x1b[38;2;88;192;158m╝\x1b[39m\x1b[38;2;84;192;161m \x1b[39m\x1b[38;2;80;192;163m \x1b[39m\x1b[38;2;76;192;166m╚\x1b[39m\x1b[38;2;72;192;169m═\x1b[39m\x1b[38;2;69;192;171m╝\x1b[39m\x1b[38;2;65;192;174m \x1b[39m\x1b[38;2;61;192;177m╚\x1b[39m\x1b[38;2;57;192;179m═\x1b[39m\x1b[38;2;53;192;182m═\x1b[39m\x1b[38;2;49;193;184m═\x1b[39m\x1b[38;2;46;193;187m═\x1b[39m\x1b[38;2;42;193;190m═\x1b[39m\x1b[38;2;38;193;192m╝\x1b[39m\n"
    );

    // Display version
    console.log(`\x1b[90mVersion: v${VERSION}\x1b[0m\n`);

    clack.intro("🚀 Create NPM Package");

    // Handle --config flag
    if (options?.config) {
      const userConfig = readUserConfig();
      if (userConfig) {
        clack.log.info(`Stored configuration (${getConfigPath()}):`);
        console.log(JSON.stringify(userConfig, null, 2));
      } else {
        clack.log.info("No configuration stored yet.");
        clack.log.info(`Config will be saved to: ${getConfigPath()}`);
      }
      process.exit(0);
    }

    // Handle --reset-config flag
    if (options?.resetConfig) {
      const existed = resetUserConfig();
      if (existed) {
        clack.log.success("Configuration reset successfully.");
      } else {
        clack.log.info("No configuration to reset.");
      }
      process.exit(0);
    }

    try {
      const isDryRun = options?.dryRun || false;
      const useDefaults = options?.yes || false;
      const skipInstall = options?.skipInstall || false;

      // Step 1: Get or confirm package name
      let finalPackageName = packageName;

      if (!finalPackageName) {
        const nameInput = handleCancel(
          await clack.text({
            message: "What is your package name?",
            placeholder: "my-awesome-package",
            validate: validatePackageName,
          })
        );
        finalPackageName = nameInput;
      } else if (!useDefaults) {
        // Skip confirmation if using defaults
        const confirmed = handleCancel(
          await clack.confirm({
            message: `Create package "${packageName}"?`,
          })
        );
        if (!confirmed) {
          clack.cancel("Operation cancelled");
          process.exit(0);
        }
      }

      // Check package name availability
      let spinner = clack.spinner();
      spinner.start("Checking package name availability on npm");
      const isAvailable = await checkPackageAvailability(finalPackageName);
      spinner.stop(
        isAvailable
          ? "✓ Package name is available"
          : "⚠ Package name already exists on npm"
      );

      if (!isAvailable) {
        clack.log.warn(
          `The package "${finalPackageName}" already exists on npm. You can still create it locally, but you won't be able to publish it with this name.`
        );
        if (!useDefaults) {
          const continueAnyway = handleCancel(
            await clack.confirm({
              message: "Continue anyway?",
              initialValue: false,
            })
          );
          if (!continueAnyway) {
            clack.cancel("Operation cancelled");
            process.exit(0);
          }
        }
      }

      // Check if directory already exists
      const targetDir = join(process.cwd(), finalPackageName);
      if (existsSync(targetDir)) {
        clack.cancel(`Directory "${finalPackageName}" already exists`);
        process.exit(1);
      }

      let language: "typescript" | "javascript";
      let moduleType: "esm" | "commonjs" | "dual";
      let testRunner: "vitest" | "jest" | "none";
      let useLinting: boolean;
      let initGit: boolean;
      let setupCI: boolean;
      let setupCD: boolean;
      let useCodecov: boolean;
      let useDependabot: boolean;

      // Step 2: Configuration (use defaults or ask questions)
      if (useDefaults) {
        // Use sensible defaults when --yes flag is used
        language = "typescript";
        moduleType = "dual";
        testRunner = "vitest";
        useLinting = true;
        initGit = false;
        setupCI = true;
        setupCD = false;
        useCodecov = false;
        useDependabot = false;
      } else {
        // Ask configuration questions
        // TypeScript is the default (first option)
        language = handleCancel(
          await clack.select({
            message: "Which language?",
            options: [
              {
                value: "typescript",
                label: "TypeScript",
                hint: "Recommended - Modern standard",
              },
              {
                value: "javascript",
                label: "JavaScript",
                hint: "Simple projects only",
              },
            ],
          })
        ) as "typescript" | "javascript";

        // Warn if JavaScript is selected
        if (language === "javascript") {
          clack.note(
            "JavaScript packages won't have type definitions.\n" +
              "Consider using TypeScript for better IDE support and type safety.",
            "⚠️  JavaScript Selected"
          );
        }

        // Always use dual format for maximum compatibility
        moduleType = "dual";

        testRunner = handleCancel(
          await clack.select({
            message: "Which test runner?",
            options: [
              { value: "vitest", label: "Vitest", hint: "Fast & modern" },
              { value: "jest", label: "Jest", hint: "Battle-tested" },
              { value: "none", label: "None" },
            ],
          })
        ) as "vitest" | "jest" | "none";

        useLinting = handleCancel(
          await clack.confirm({
            message: "Initialize ESLint + Prettier?",
            initialValue: true,
          })
        );

        initGit = handleCancel(
          await clack.confirm({
            message: "Initialize a new git repository?",
            initialValue: false,
          })
        );

        // Ask about CI/CD setup
        setupCI = handleCancel(
          await clack.confirm({
            message: "Set up GitHub Actions CI? (runs tests on every push/PR)",
            initialValue: testRunner !== "none",
          })
        );

        if (setupCI) {
          // Show CD information BEFORE asking
          clack.note(
            "Automated publishing using GitHub Actions.\n\n" +
              "Benefits:\n" +
              "• Automatically publishes to npm when you create a GitHub release\n" +
              "• Runs tests before publishing\n" +
              "• No manual npm publish needed\n\n" +
              "How it works:\n" +
              "1. Update version: npm version patch/minor/major\n" +
              "2. Push: git push && git push --tags\n" +
              "3. Create GitHub release → automatically publishes to npm\n\n" +
              "Recommended: Skip for beginners (can set up later)\n" +
              "Requires: NPM_TOKEN secret in GitHub repository",
            "Automated Publishing (CD)"
          );

          setupCD = handleCancel(
            await clack.confirm({
              message: "Set up automated publishing to npm? (CD workflow)",
              initialValue: false,
            })
          );

          // Ask about Codecov only if tests are configured
          if (testRunner !== "none") {
            clack.note(
              "Codecov tracks test coverage over time and shows coverage in PRs.\n\n" +
                "Benefits:\n" +
                "• Visualize coverage trends with graphs and badges\n" +
                "• See coverage changes in pull requests\n" +
                "• Identify untested code paths\n\n" +
                "Recommended: Skip for beginners (can be added later)\n" +
                "Requires: CODECOV_TOKEN secret in GitHub repository",
              "Test Coverage Tracking"
            );

            useCodecov = handleCancel(
              await clack.confirm({
                message: "Upload test coverage to Codecov?",
                initialValue: false,
              })
            );
          } else {
            useCodecov = false; // No tests, no coverage
          }

          // Ask about Dependabot (always available if CI is enabled)
          clack.note(
            "Dependabot automatically creates PRs to update dependencies.\n\n" +
              "Benefits:\n" +
              "• Keep dependencies up-to-date automatically\n" +
              "• Get security vulnerability alerts and fixes\n" +
              "• Reduce maintenance burden\n" +
              "• Configure update frequency (daily/weekly/monthly)\n\n" +
              "Recommended: Skip for beginners (can add noise with many PRs)\n" +
              "Note: Free for all GitHub repositories, no secrets needed",
            "Automated Dependency Updates"
          );

          useDependabot = handleCancel(
            await clack.confirm({
              message: "Set up Dependabot for automated dependency updates?",
              initialValue: false,
            })
          );
        } else {
          setupCD = false;
          useCodecov = false; // No CI, no Codecov
          useDependabot = false; // No CI, no Dependabot
        }
      }

      // Step 3: Ask for additional metadata (skip if using defaults)
      let description: string | undefined;
      let author: string | undefined;
      let authorEmail: string | undefined;
      let githubUsername: string | undefined;
      let shouldSaveConfig = false;

      if (!useDefaults) {
        description =
          handleCancel(
            await clack.text({
              message: "Package description (optional):",
              placeholder: "A brief description of your package",
              defaultValue: "",
            })
          ) || undefined;

        // Try to load from stored config first
        const storedConfig = readUserConfig();

        if (storedConfig) {
          // Use stored configuration
          author = storedConfig.author;
          authorEmail = storedConfig.email;
          githubUsername = storedConfig.github;

          clack.log.info(
            `Using stored author info: ${storedConfig.author || ""}${
              storedConfig.email ? ` <${storedConfig.email}>` : ""
            }`
          );
        } else {
          // Try to read from git config
          const gitConfig = readGitConfig();

          if (gitConfig && (gitConfig.name || gitConfig.email)) {
            // Git config found, ask if user wants to use it
            const useGitConfig = handleCancel(
              await clack.confirm({
                message: `Use git config: ${formatGitConfig(gitConfig)}?`,
                initialValue: true,
              })
            );

            if (useGitConfig) {
              author = gitConfig.name;
              authorEmail = gitConfig.email;

              // Only ask for GitHub username
              githubUsername =
                handleCancel(
                  await clack.text({
                    message: "GitHub username (optional):",
                    placeholder: "yourusername",
                    defaultValue: "",
                  })
                ) || undefined;
            } else {
              // User declined git config, ask all fields but pre-fill with git values
              author =
                handleCancel(
                  await clack.text({
                    message: "Author name (optional):",
                    placeholder: "Your Name",
                    defaultValue: gitConfig.name || "",
                  })
                ) || undefined;

              authorEmail =
                handleCancel(
                  await clack.text({
                    message: "Author email (optional):",
                    placeholder: "your.email@example.com",
                    defaultValue: gitConfig.email || "",
                  })
                ) || undefined;

              githubUsername =
                handleCancel(
                  await clack.text({
                    message: "GitHub username (optional):",
                    placeholder: "yourusername",
                    defaultValue: "",
                  })
                ) || undefined;
            }
          } else {
            // No git config found, ask all fields
            author =
              handleCancel(
                await clack.text({
                  message: "Author name (optional):",
                  placeholder: "Your Name",
                  defaultValue: "",
                })
              ) || undefined;

            authorEmail =
              handleCancel(
                await clack.text({
                  message: "Author email (optional):",
                  placeholder: "your.email@example.com",
                  defaultValue: "",
                })
              ) || undefined;

            githubUsername =
              handleCancel(
                await clack.text({
                  message: "GitHub username (optional):",
                  placeholder: "yourusername",
                  defaultValue: "",
                })
              ) || undefined;
          }

          // Ask if user wants to save for future projects (only if not already stored and --no-save not specified)
          if (
            !storedConfig &&
            !options?.noSave &&
            (author || authorEmail || githubUsername)
          ) {
            shouldSaveConfig = handleCancel(
              await clack.confirm({
                message: "Save this information for future projects?",
                initialValue: true,
              })
            );

            if (shouldSaveConfig) {
              clack.note(
                `Configuration will be saved to:\n${getConfigPath()}`,
                "Info"
              );
            }
          }
        }
      }

      // Step 4: Package manager selection (auto-detect if using defaults)
      const packageManager = useDefaults
        ? detectPackageManager()
        : (handleCancel(
            await clack.select({
              message: "Which package manager?",
              options: [
                { value: "npm", label: "npm" },
                { value: "pnpm", label: "pnpm", hint: "Faster, efficient" },
                { value: "yarn", label: "Yarn" },
                { value: "bun", label: "Bun", hint: "Fastest" },
              ],
              initialValue: detectPackageManager(),
            })
          ) as "npm" | "pnpm" | "yarn" | "bun");

      const config: ProjectConfig = {
        packageName: finalPackageName,
        language,
        moduleType,
        testRunner,
        useLinting,
        initGit,
        setupCI,
        setupCD,
        useCodecov,
        useDependabot,
        packageManager,
        description: description || undefined,
        author: author || undefined,
        authorEmail: authorEmail || undefined,
        githubUsername: githubUsername || undefined,
      };

      // Step 5: Show configuration summary (skip final confirmation if using defaults)
      if (!useDefaults) {
        clack.note(
          `Package: ${config.packageName}
Language: ${config.language === "typescript" ? "TypeScript" : "JavaScript"}
Module format: ${config.moduleType.toUpperCase()}
Test runner: ${config.testRunner === "none" ? "None" : config.testRunner}
Linting: ${config.useLinting ? "Yes (ESLint + Prettier)" : "No"}
Git: ${config.initGit ? "Yes" : "No"}
CI/CD: ${
            config.setupCI
              ? config.setupCD
                ? "CI + CD"
                : "CI only"
              : "No"
          }${
            config.setupCI && config.testRunner !== "none"
              ? `\nCodecov: ${config.useCodecov ? "Yes" : "No"}`
              : ""
          }${
            config.setupCI
              ? `\nDependabot: ${config.useDependabot ? "Yes" : "No"}`
              : ""
          }
Package Manager: ${config.packageManager}${
            config.description ? `\nDescription: ${config.description}` : ""
          }${config.author ? `\nAuthor: ${config.author}` : ""}${
            config.authorEmail ? ` <${config.authorEmail}>` : ""
          }${
            config.githubUsername ? `\nGitHub: @${config.githubUsername}` : ""
          }`,
          "Configuration Summary"
        );

        const proceed = handleCancel(
          await clack.confirm({
            message: "Proceed with this configuration?",
            initialValue: true,
          })
        );

        if (!proceed) {
          clack.cancel("Operation cancelled");
          process.exit(0);
        }
      } else {
        // Show simplified message when using defaults
        clack.log.info(
          `Creating ${config.packageName} with recommended defaults (TypeScript + Vitest + Linting)`
        );
      }

      // Dry run mode - just show what would be created
      if (isDryRun) {
        clack.log.info("🔍 Dry run mode - no files will be created");
        clack.log.info("\nFiles that would be created:");
        clack.log.info(`  ${finalPackageName}/`);
        clack.log.info(`    src/`);
        clack.log.info(
          `      index.${config.language === "typescript" ? "ts" : "js"}`
        );
        if (config.testRunner !== "none") {
          clack.log.info(
            `      index.test.${config.language === "typescript" ? "ts" : "js"}`
          );
        }
        clack.log.info(`    package.json`);
        clack.log.info(`    README.md`);
        clack.log.info(`    .gitignore`);
        if (config.language === "typescript") {
          clack.log.info(`    .npmignore         # Exclude source files from npm package`);
          clack.log.info(`    tsconfig.json`);
          clack.log.info(`    tsup.config.ts`);
          clack.log.info(
            `    index.js           # Root re-export for better IDE autocomplete`
          );
          clack.log.info(`    index.d.ts         # Root type definitions`);
          if (config.moduleType === "dual") {
            clack.log.info(
              `    index.mjs          # ESM re-export for dual format`
            );
          }
        }
        if (config.useLinting) {
          clack.log.info(`    .eslintrc.json`);
          clack.log.info(`    .prettierrc`);
          clack.log.info(`    .editorconfig`);
        }
        if (config.testRunner === "vitest") {
          clack.log.info(`    vitest.config.ts`);
        } else if (config.testRunner === "jest") {
          clack.log.info(
            `    jest.config.${config.language === "typescript" ? "ts" : "js"}`
          );
        }
        if (config.setupCI) {
          clack.log.info(`    .github/workflows/ci.yml`);
        }
        if (config.setupCD) {
          clack.log.info(`    .github/workflows/publish.yml`);
        }
        if (config.useDependabot) {
          clack.log.info(`    .github/dependabot.yml`);
        }
        clack.outro("✨ Dry run complete!");
        return;
      }

      // Step 6: Create project
      spinner = clack.spinner();
      spinner.start("Creating project structure");

      await createProject(config, targetDir);

      spinner.stop("✓ Project structure created!");

      // Step 7: Install dependencies
      let shouldInstall = !skipInstall;

      // Ask user if they want to install dependencies (unless using --yes or --skip-install)
      if (!skipInstall && !useDefaults) {
        shouldInstall = handleCancel(
          await clack.confirm({
            message: `Install dependencies now with ${config.packageManager}?`,
            initialValue: true,
          })
        );
      }

      if (shouldInstall) {
        clack.log.step(
          `Installing dependencies with ${config.packageManager}...`
        );
        clack.log.info("This may take a minute. Please wait...");

        try {
          const installCmd =
            config.packageManager === "yarn"
              ? "yarn"
              : `${config.packageManager} install`;

          // Use 'inherit' to show live output instead of hiding it
          execSync(installCmd, {
            cwd: targetDir,
            stdio: "inherit",
          });

          clack.log.success("✓ Dependencies installed!");
        } catch (error) {
          clack.log.error("⚠ Failed to install dependencies");
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          clack.log.warn(`Error: ${errorMsg}`);
          clack.note(
            `You can install them manually by running:\n  cd ${finalPackageName}\n  ${config.packageManager} install`,
            "Manual Installation Required"
          );
        }
      } else {
        clack.log.info("⏭ Skipping dependency installation");
      }

      // Step 8: Initialize git and changesets in parallel (only if dependencies were installed)
      if (shouldInstall) {
        const postInstallTasks: Promise<{
          success: boolean;
          task: string;
          error?: string;
        }>[] = [];

        if (config.initGit) {
          postInstallTasks.push(
            (async () => {
              try {
                execSync("git init", { cwd: targetDir, stdio: "pipe" });
                execSync("git add .", { cwd: targetDir, stdio: "pipe" });
                execSync(`git commit -m "${INITIAL_COMMIT_MESSAGE}"`, {
                  cwd: targetDir,
                  stdio: "pipe",
                });
                return { success: true, task: "git" };
              } catch (error) {
                return {
                  success: false,
                  task: "git",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                };
              }
            })()
          );
        }


        if (postInstallTasks.length > 0) {
          spinner.start("Running post-install tasks");
          const results = await Promise.allSettled(postInstallTasks);

          results.forEach((result) => {
            if (result.status === "fulfilled") {
              const { success, task, error } = result.value;
              if (success) {
                clack.log.success(`✓ ${task} initialized`);
              } else {
                clack.log.warn(`⚠ Failed to initialize ${task}: ${error}`);
              }
            }
          });

          spinner.stop("Post-install tasks completed");
        }

        // Step 9: Post-install verification
        if (config.language === "typescript") {
          spinner.start("Verifying installation");
          try {
            execSync(`${config.packageManager} run build`, {
              cwd: targetDir,
              stdio: "pipe",
            });
            spinner.stop("✓ Build successful - everything is working!");
          } catch (error) {
            spinner.stop("⚠ Build verification failed");
            const errorMsg =
              error instanceof Error ? error.message : "Unknown error";
            clack.log.warn(
              `The project was created but the build failed. You may need to fix some issues.\nError: ${errorMsg}`
            );
          }
        }
      }

      // Save user config if requested
      if (shouldSaveConfig) {
        try {
          await writeUserConfig({
            author,
            email: authorEmail,
            github: githubUsername,
          });
          clack.log.success("✓ Configuration saved for future projects");
        } catch (error) {
          clack.log.warn(
            `Failed to save configuration: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Success message
      clack.outro("✨ All done! Your package is ready.");

      console.log("\n📦 Next steps:\n");
      console.log(`  cd ${finalPackageName}`);
      if (!shouldInstall) {
        console.log(
          `  ${config.packageManager} install  # Install dependencies`
        );
      }
      console.log("  npm run build        # Build your package");
      if (config.testRunner !== "none") {
        console.log("  npm test             # Run tests");
      }
      console.log("  npm run check:exports # Validate package exports");
      if (config.useLinting) {
        console.log("  npm run lint         # Lint your code");
      }
      console.log("");
    } catch (error) {
      clack.cancel("An error occurred");
      console.error(error);
      process.exit(1);
    }
  });

program.parse();

/**
 * Creates the project directory structure and files
 */
async function createProject(
  config: ProjectConfig,
  targetDir: string
): Promise<void> {
  // Create main directory
  await mkdir(targetDir, { recursive: true });

  // Create src directory
  const srcDir = join(targetDir, "src");
  await mkdir(srcDir, { recursive: true });

  // Create example source file
  const mainFile = config.language === "typescript" ? "index.ts" : "index.js";
  const exampleCode =
    config.language === "typescript"
      ? `/**
 * Example function that greets a user
 * @param name - The name to greet
 * @returns A greeting message
 */
export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

/**
 * Example function that adds two numbers
 * @param a - First number
 * @param b - Second number
 * @returns The sum of a and b
 */
export function add(a: number, b: number): number {
  return a + b;
}
`
      : `/**
 * Example function that greets a user
 * @param {string} name - The name to greet
 * @returns {string} A greeting message
 */
export function greet(name) {
  return \`Hello, \${name}!\`;
}

/**
 * Example function that adds two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum of a and b
 */
export function add(a, b) {
  return a + b;
}
`;

  await writeFile(join(srcDir, mainFile), exampleCode);

  // Create test file if testing is enabled
  if (config.testRunner !== "none") {
    const testExt = config.language === "typescript" ? "ts" : "js";
    const testFile = `index.test.${testExt}`;
    const testCode =
      config.language === "typescript"
        ? `import { describe, it, expect } from '${
            config.testRunner === "vitest" ? "vitest" : "@jest/globals"
          }';
import { greet, add } from './index.js';

describe('greet', () => {
  it('should return a greeting message', () => {
    expect(greet('World')).toBe('Hello, World!');
  });
});

describe('add', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });
});
`
        : `import { describe, it, expect } from '${
            config.testRunner === "vitest" ? "vitest" : "@jest/globals"
          }';
import { greet, add } from './index.js';

describe('greet', () => {
  it('should return a greeting message', () => {
    expect(greet('World')).toBe('Hello, World!');
  });
});

describe('add', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });
});
`;

    await writeFile(join(srcDir, testFile), testCode);
  }

  // Generate configuration files
  await writeFile(
    join(targetDir, "package.json"),
    JSON.stringify(generatePackageJson(config), null, 2)
  );

  await writeFile(join(targetDir, "README.md"), generateReadme(config));
  await writeFile(join(targetDir, ".gitignore"), generateGitignore());

  // Generate .npmignore for TypeScript projects
  if (config.language === 'typescript') {
    await writeFile(join(targetDir, ".npmignore"), generateNpmignore(config));
  }

  // TypeScript-specific files
  if (config.language === "typescript") {
    await writeFile(
      join(targetDir, "tsconfig.json"),
      JSON.stringify(generateTsConfig(config), null, 2)
    );
    await writeFile(
      join(targetDir, "tsup.config.ts"),
      generateTsupConfig(config)
    );

    // Generate root index files for better IDE experience
    // Following the pattern used by axios, express, and jsforce
    await writeFile(join(targetDir, "index.js"), generateRootIndexJs(config));
    await writeFile(
      join(targetDir, "index.d.ts"),
      generateRootIndexDts(config)
    );

    // For dual format, also generate index.mjs
    if (config.moduleType === "dual") {
      await writeFile(
        join(targetDir, "index.mjs"),
        generateRootIndexMjs(config)
      );
    }
  }

  // Linting files
  if (config.useLinting) {
    await writeFile(
      join(targetDir, ".eslintrc.json"),
      JSON.stringify(generateEslintConfig(config), null, 2)
    );
    await writeFile(
      join(targetDir, ".prettierrc"),
      JSON.stringify(generatePrettierConfig(), null, 2)
    );
    await writeFile(join(targetDir, ".editorconfig"), generateEditorConfig());
  }

  // Test configuration files
  if (config.testRunner === "vitest") {
    await writeFile(
      join(targetDir, "vitest.config.ts"),
      generateVitestConfig()
    );
  } else if (config.testRunner === "jest") {
    const jestExt = config.language === "typescript" ? "ts" : "js";
    await writeFile(
      join(targetDir, `jest.config.${jestExt}`),
      generateJestConfig(config)
    );
  }

  // GitHub Actions workflows and Dependabot
  if (config.setupCD || config.setupCI || config.useDependabot) {
    const githubDir = join(targetDir, ".github");
    const workflowDir = join(githubDir, "workflows");
    await mkdir(workflowDir, { recursive: true });

    // CD publish workflow
    if (config.setupCD) {
      const publishWorkflow = `name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Tests
        run: npm run test:all

      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`;

      await writeFile(join(workflowDir, "publish.yml"), publishWorkflow);
    }

    // CI workflow
    if (config.setupCI) {
      await writeFile(join(workflowDir, "ci.yml"), generateCIWorkflow(config));
    }

    // Dependabot configuration
    if (config.useDependabot) {
      await writeFile(
        join(githubDir, "dependabot.yml"),
        generateDependabotConfig()
      );
    }
  }
}

/**
 * Detects which package manager the user prefers
 */
function detectPackageManager(): "npm" | "pnpm" | "yarn" | "bun" {
  const userAgent = process.env.npm_config_user_agent || "";

  if (userAgent.includes("pnpm")) return "pnpm";
  if (userAgent.includes("yarn")) return "yarn";
  if (userAgent.includes("bun")) return "bun";

  return "npm";
}
