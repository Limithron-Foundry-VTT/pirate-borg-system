import dotenv from "dotenv";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import { createInterface } from "readline";

/**
 * Expand ${VAR} syntax in a value
 * Supports nested/recursive expansion
 * @param {string} value - Value to expand
 * @param {Object} env - Environment variables object
 * @param {Set} seen - Set to track circular references
 * @returns {string} Expanded value
 */
function expandVariables(value, env, seen = new Set()) {
  if (typeof value !== "string") return value;

  let result = value;
  let maxIterations = 10; // Prevent infinite loops
  let changed = true;

  while (changed && maxIterations-- > 0) {
    changed = false;
    result = result.replace(/\$\{(\w+)\}/g, (match, varName) => {
      if (seen.has(varName)) {
        // Circular reference detected
        return match;
      }

      const replacement = env[varName] || process.env[varName] || "";
      if (replacement !== match) {
        changed = true;
      }
      return replacement;
    });
  }

  return result;
}

/**
 * Load environment variables from .env file using dotenv
 * Applies custom ${VAR} expansion for backward compatibility
 * @returns {Object} Environment variables object
 */
export function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env");

    if (!fs.existsSync(envPath)) {
      return {}; // No .env file, use defaults
    }

    const result = dotenv.config({ path: envPath, quiet: true });

    if (result.error) {
      throw result.error;
    }

    // Apply variable substitution for ${VAR} syntax
    const parsed = result.parsed || {};
    const expanded = {};

    for (const [key, value] of Object.entries(parsed)) {
      expanded[key] = expandVariables(value, parsed);
      process.env[key] = expanded[key];
    }

    return expanded;
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

/**
 * Get configuration with defaults
 * @returns {Object} Configuration object
 */
export function getConfig() {
  loadEnv();

  const config = {
    systemName: process.env.SYSTEM_NAME || "pirateborg",
    foundryApiEndpoint: process.env.FOUNDRY_API_STATUS_ENDPOINT || "http://localhost:30000/api/status",
    worktreeBaseDir: process.env.WORKTREE_BASE_DIR || "../",
    foundryInstallPath: process.env.FOUNDRY_INSTALL_PATH || "versions/local-data/13/Data/systems/pirateborg",
  };

  config.worktreeBaseDirAbs = resolveAbsolutePath(config.worktreeBaseDir);

  config.foundryInstallPathAbs = resolveAbsolutePath(config.foundryInstallPath);

  return config;
}

/**
 * Make HTTP/HTTPS GET request
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<string>} Response body
 */
function httpGet(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

/**
 * Check Foundry VTT status via HTTP API
 * @param {string} apiEndpoint - Foundry API endpoint URL
 * @returns {Promise<Object>} Status object: { active, world?, version, error? }
 */
export async function checkFoundryStatus(apiEndpoint) {
  try {
    const response = await httpGet(apiEndpoint, 5000);
    const status = JSON.parse(response);

    return {
      active: status.active || false,
      world: status.world || null,
      system: status.system || null,
      version: status.version || "unknown",
      users: status.users || 0,
    };
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      return { active: false, version: "unknown" };
    }
    throw new Error(`Failed to check Foundry status: ${err.message}`);
  }
}

/**
 * Prompt user for confirmation
 * @param {string} message - Prompt message
 * @param {boolean} defaultYes - Default to yes
 * @returns {Promise<boolean>} User's choice
 */
export function promptConfirm(message, defaultYes = false) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const suffix = defaultYes ? " (Y/n) " : " (y/N) ";
    rl.question(message + suffix, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (!normalized) {
        resolve(defaultYes);
      } else {
        resolve(normalized === "y" || normalized === "yes");
      }
    });
  });
}

/**
 * Check Foundry status and prompt if active
 * @param {string} apiEndpoint - Foundry API endpoint URL
 * @returns {Promise<boolean>} True if safe to proceed, false if user canceled
 */
export async function promptContinueIfActive(apiEndpoint) {
  try {
    console.log("\x1b[33m⚠\x1b[0m  Checking Foundry status...");
    const status = await checkFoundryStatus(apiEndpoint);

    if (!status.active) {
      console.log("\x1b[32m✓\x1b[0m Foundry not running");
      return true;
    }

    // Foundry is active with a world loaded
    console.log("\x1b[33m⚠\x1b[0m  Foundry is running with world '\x1b[1m" + status.world + "\x1b[0m' loaded");
    console.log("   Switching now will cause corruption or data loss within LevelDB files.");
    console.log("   Please close the world in Foundry before continuing.");
    console.log();

    const shouldContinue = await promptConfirm("Continue anyway?", false);
    if (!shouldContinue) {
      console.log("\x1b[31m✗\x1b[0m Switch cancelled by user");
      return false;
    }

    return true;
  } catch (err) {
    console.log("\x1b[33m⚠\x1b[0m  Could not check Foundry status: " + err.message);
    const shouldContinue = await promptConfirm(
      "Continue without status check? Switching while Foundry VTT is running a world will cause corruption or data loss within LevelDB files.",
      false
    );
    if (!shouldContinue) {
      console.log("\x1b[31m✗\x1b[0m Operation cancelled by user");
      return false;
    }
    return true;
  }
}

/**
 * Resolve path to absolute
 * @param {string} relativePath - Relative path
 * @param {string} basePath - Base path (defaults to cwd)
 * @returns {string} Absolute path
 */
export function resolveAbsolutePath(relativePath, basePath = process.cwd()) {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  return path.resolve(basePath, relativePath);
}

/**
 * Get symlink target (absolute path)
 * @param {string} symlinkPath - Path to symlink
 * @returns {string} Absolute path to target
 */
export function getSymlinkTarget(symlinkPath) {
  try {
    const target = fs.readlinkSync(symlinkPath);
    const symlinkDir = path.dirname(symlinkPath);
    return path.resolve(symlinkDir, target);
  } catch (err) {
    throw new Error(`Failed to read symlink at ${symlinkPath}: ${err.message}`);
  }
}

/**
 * Validate directory contains valid Foundry system
 * @param {string} dirPath - Directory path to validate
 * @param {string} expectedSystemId - Expected system id
 * @returns {boolean} True if valid system directory
 */
export function validateSystemDirectory(dirPath, expectedSystemId = "pirateborg") {
  try {
    const systemJsonPath = path.join(dirPath, "system.json");
    if (!fs.existsSync(systemJsonPath)) {
      return false;
    }

    const systemJson = JSON.parse(fs.readFileSync(systemJsonPath, "utf8"));
    return systemJson.id === expectedSystemId;
  } catch (err) {
    return false;
  }
}

/**
 * Create relative symlink
 * @param {string} targetPath - Absolute path to target
 * @param {string} symlinkPath - Absolute path where symlink should be created
 */
export function createRelativeSymlink(targetPath, symlinkPath) {
  const symlinkDir = path.dirname(symlinkPath);
  const relativePath = path.relative(symlinkDir, targetPath);

  // Remove old symlink if exists
  if (fs.existsSync(symlinkPath)) {
    fs.unlinkSync(symlinkPath);
  }

  // Create new symlink
  fs.symlinkSync(relativePath, symlinkPath);

  const actualTarget = fs.readlinkSync(symlinkPath);
  console.log(`\x1b[32m✓\x1b[0m Symlink updated: ${path.basename(symlinkPath)} -> ${actualTarget}`);
}
