import { execSync } from "child_process";
import fs from "fs";
import logger from "fancy-log";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createRelativeSymlink, getConfig, getSymlinkTarget, promptConfirm, promptContinueIfActive, validateSystemDirectory } from "./foundry-api.mjs";
import { listPullRequests, getPullRequestDetails, openPullRequest, getRepositoryInfo } from "./github-api.mjs";

// eslint-disable-next-line
const argv = yargs(hideBin(process.argv))
  .command(newCommand())
  .command(switchCommand())
  .command(listCommand())
  .command(removeCommand())
  .command(prCommand())
  .help()
  .alias("help", "h").argv;

/**
 * Sanitize branch name for directory naming
 * @param {string} branch - Branch name
 * @returns {string} Sanitized name
 */
function sanitizeBranchName(branch) {
  return branch
    .replace(/^refs\/heads\//, "") // Remove refs/heads/ prefix
    .replace(/\//g, "-") // Replace / with -
    .replace(/[^a-zA-Z0-9-_]/g, "") // Remove special chars
    .toLowerCase();
}

/**
 * Get list of git worktrees
 * @returns {Array<Object>} Array of worktree objects
 */
function getWorktreeList() {
  try {
    const output = execSync("git worktree list --porcelain", { encoding: "utf8" });
    const worktrees = [];
    let current = {};

    output.split("\n").forEach((line) => {
      if (line.startsWith("worktree ")) {
        if (current.path) worktrees.push(current);
        current = { path: line.substring(9) };
      } else if (line.startsWith("branch ")) {
        current.branch = line.substring(7).replace("refs/heads/", "");
      } else if (line.startsWith("HEAD ")) {
        current.head = line.substring(5);
      } else if (line === "detached") {
        current.detached = true;
      } else if (line === "bare") {
        current.bare = true;
      }
    });

    if (current.path) worktrees.push(current);
    return worktrees;
  } catch (err) {
    throw new Error(`Failed to get worktree list: ${err.message}`);
  }
}

/**
 * Resolve target to absolute worktree path
 * @param {string} target - Target (path, branch name, or worktree name)
 * @param {Object} config - Configuration object
 * @returns {string} Absolute path to worktree
 */
function resolveWorktreeTarget(target, config) {
  // 1. Check if absolute path
  if (path.isAbsolute(target)) {
    return target;
  }

  // 2. Check if relative path (starts with . or /)
  if (target.startsWith(".")) {
    return path.resolve(process.cwd(), target);
  }

  // 3. Try as branch name in worktree list
  const worktrees = getWorktreeList();
  const byBranch = worktrees.find((w) => w.branch === target);
  if (byBranch) {
    return byBranch.path;
  }

  // 4. Try as worktree directory name
  const worktreeDir = sanitizeBranchName(target);
  const fullPath = path.join(config.worktreeBaseDirAbs, `pirate-borg-${worktreeDir}`);
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }

  // 5. Not found
  throw new Error(`Could not resolve target: ${target}\nTry using an absolute path or run 'npm run worktree:list' to see available worktrees.`);
}

/**
 * Validate target is an actual git worktree
 * @param {string} targetPath - Path to validate
 * @returns {boolean} True if valid worktree
 */
function isValidWorktree(targetPath) {
  const worktrees = getWorktreeList();
  return worktrees.some((w) => w.path === targetPath);
}

/**
 * Get git status for a worktree
 * @param {string} worktreePath - Path to worktree
 * @returns {string} Status string
 */
function getWorktreeStatus(worktreePath) {
  try {
    const status = execSync("git status --porcelain", {
      cwd: worktreePath,
      encoding: "utf8",
    });
    return status.trim() ? "modified" : "clean";
  } catch (err) {
    return "error";
  }
}

function newCommand() {
  return {
    command: "new <branch> [base]",
    describe: "Create a new worktree",
    builder: (yargs) => {
      yargs.positional("branch", {
        describe: "Branch name for the new worktree",
        type: "string",
      });
      yargs.positional("base", {
        describe: "Base branch to create from (default: current branch)",
        type: "string",
      });
    },
    handler: async (argv) => {
      try {
        await createWorktree(argv.branch, argv.base);
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m Error: ${err.message}`);
        process.exit(1);
      }
    },
  };
}

async function createWorktree(branchName, baseBranch) {
  const config = getConfig();

  const sanitizedName = sanitizeBranchName(branchName);
  const worktreePath = path.join(config.worktreeBaseDirAbs, `pirate-borg-${sanitizedName}`);

  if (fs.existsSync(worktreePath)) {
    throw new Error(`Worktree directory already exists: ${worktreePath}`);
  }

  logger.info(`Creating worktree: pirate-borg-${sanitizedName}`);

  let branchExists = false;
  try {
    execSync(`git rev-parse --verify ${branchName}`, { stdio: "ignore" });
    branchExists = true;
  } catch (err) {
    // Branch doesn't exist, continue
  }

  let gitCmd;
  if (branchExists) {
    // Branch exists, check it out
    gitCmd = `git worktree add "${worktreePath}" ${branchName}`;
  } else if (baseBranch) {
    // Create new branch from base
    gitCmd = `git worktree add "${worktreePath}" -b ${branchName} ${baseBranch}`;
  } else {
    // Create new branch from current HEAD
    gitCmd = `git worktree add "${worktreePath}" -b ${branchName}`;
  }

  try {
    execSync(gitCmd, { stdio: "inherit" });
  } catch (err) {
    throw new Error(`Failed to create worktree: ${err.message}`);
  }

  console.log(`\x1b[32m✓\x1b[0m Worktree created at: ${worktreePath}`);

  console.log();
  const shouldSwitch = await promptConfirm("Switch Foundry symlink to this worktree?", true);
  if (shouldSwitch) {
    await switchWorktree(worktreePath);
  } else {
    console.log("\x1b[90mYou can switch later with: npm run worktree:switch " + branchName + "\x1b[0m");
  }
}

function switchCommand() {
  return {
    command: "switch <target>",
    describe: "Switch Foundry symlink to different worktree",
    builder: (yargs) => {
      yargs.positional("target", {
        describe: "Target worktree (path, branch name, or worktree name)",
        type: "string",
      });
    },
    handler: async (argv) => {
      try {
        const config = getConfig();
        const targetPath = resolveWorktreeTarget(argv.target, config);
        await switchWorktree(targetPath);
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m Error: ${err.message}`);
        process.exit(1);
      }
    },
  };
}

async function switchWorktree(targetPath) {
  const config = getConfig();

  if (!isValidWorktree(targetPath)) {
    throw new Error(`Target is not a valid git worktree: ${targetPath}`);
  }

  if (!validateSystemDirectory(targetPath, config.systemName)) {
    throw new Error(`Target directory does not contain valid ${config.systemName} system: ${targetPath}`);
  }

  const canProceed = await promptContinueIfActive(config.foundryApiEndpoint);
  if (!canProceed) {
    process.exit(2); // User cancelled
  }

  let currentTarget;
  try {
    currentTarget = getSymlinkTarget(config.foundryInstallPathAbs);
  } catch (err) {
    // Symlink doesn't exist or is broken, continue
    currentTarget = null;
  }

  if (currentTarget === targetPath) {
    console.log(`\x1b[32m✓\x1b[0m Symlink already points to: ${targetPath}`);
    return;
  }

  try {
    createRelativeSymlink(targetPath, config.foundryInstallPathAbs);
    console.log(`\x1b[32m✓\x1b[0m Successfully switched to: ${path.basename(targetPath)}`);
  } catch (err) {
    throw new Error(`Failed to update symlink: ${err.message}`);
  }
}

function listCommand() {
  return {
    command: "list",
    describe: "List all worktrees and current symlink",
    handler: () => {
      try {
        listWorktrees();
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m Error: ${err.message}`);
        process.exit(1);
      }
    },
  };
}

function listWorktrees() {
  const config = getConfig();
  const worktrees = getWorktreeList();

  let currentTarget = null;
  try {
    currentTarget = getSymlinkTarget(config.foundryInstallPathAbs);
  } catch (err) {
    // Symlink doesn't exist or is broken, continue
  }

  console.log("\nGit Worktrees:\n");

  worktrees.forEach((wt, index) => {
    const isActive = currentTarget === wt.path;
    const activeMarker = isActive ? " \x1b[32m← ACTIVE\x1b[0m" : "";
    const status = getWorktreeStatus(wt.path);
    const statusIcon = status === "clean" ? "✓" : status === "modified" ? "!" : "?";

    console.log(`  ${index + 1}. ${wt.path}${activeMarker}`);
    console.log(`     Branch: ${wt.branch || "(detached)"}`);
    console.log(`     Status: ${statusIcon} ${status}`);
    console.log();
  });

  console.log("Current Foundry Symlink:");
  if (currentTarget) {
    const targetName = path.basename(currentTarget);
    const relPath = path.relative(config.worktreeBaseDirAbs, currentTarget);
    console.log(`  → ${relPath} (${targetName})`);
  } else {
    console.log("  \x1b[31m✗ Not set or broken\x1b[0m");
  }
  console.log();
}

function removeCommand() {
  return {
    command: "remove <target>",
    describe: "Remove a worktree",
    builder: (yargs) => {
      yargs.positional("target", {
        describe: "Target worktree to remove (path, branch name, or worktree name)",
        type: "string",
      });
    },
    handler: async (argv) => {
      try {
        const config = getConfig();
        const targetPath = resolveWorktreeTarget(argv.target, config);
        await removeWorktree(targetPath);
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m Error: ${err.message}`);
        process.exit(1);
      }
    },
  };
}

async function removeWorktree(targetPath) {
  const config = getConfig();

  if (!isValidWorktree(targetPath)) {
    throw new Error(`Target is not a valid git worktree: ${targetPath}`);
  }

  let currentTarget = null;
  try {
    currentTarget = getSymlinkTarget(config.foundryInstallPathAbs);
  } catch (err) {
    // Symlink doesn't exist, continue
  }

  if (currentTarget === targetPath) {
    throw new Error(`Cannot remove active worktree.\nPlease switch to a different worktree first with: npm run worktree:switch <target>`);
  }

  console.log(`\x1b[33m⚠\x1b[0m  About to remove worktree: ${targetPath}`);
  const shouldRemove = await promptConfirm("Remove worktree?", false);
  if (!shouldRemove) {
    console.log("\x1b[31m✗\x1b[0m Removal cancelled by user");
    process.exit(2);
  }

  try {
    execSync(`git worktree remove "${targetPath}"`, { stdio: "inherit" });
    console.log(`\x1b[32m✓\x1b[0m Worktree removed: ${targetPath}`);
  } catch (err) {
    throw new Error(`Failed to remove worktree: ${err.message}`);
  }
}

function prCommand() {
  return {
    command: "pr <action> [pr-number]",
    describe: "Manage pull requests for worktrees",
    builder: (yargs) => {
      return yargs
        .positional("action", {
          describe: "Action to perform",
          choices: ["list", "checkout", "view"],
        })
        .positional("pr-number", {
          describe: "PR number (required for checkout/view)",
          type: "number",
        });
    },
    handler: async (argv) => {
      try {
        if (argv.action === "list") {
          await listPullRequestsWithWorktrees();
        } else if (argv.action === "checkout") {
          if (!argv.prNumber) {
            throw new Error("PR number is required for checkout action");
          }
          await checkoutPullRequest(argv.prNumber);
        } else if (argv.action === "view") {
          if (!argv.prNumber) {
            throw new Error("PR number is required for view action");
          }
          await viewPullRequest(argv.prNumber);
        }
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m Error: ${err.message}`);
        process.exit(1);
      }
    },
  };
}

async function listPullRequestsWithWorktrees() {
  try {
    const repoInfo = getRepositoryInfo();
    const prs = listPullRequests({ state: "open" });
    const worktrees = getWorktreeList();

    if (prs.length === 0) {
      console.log("\nNo open pull requests found.\n");
      return;
    }

    console.log(`\nPull Requests (${repoInfo.fullName}):\n`);

    prs.forEach((pr) => {
      const hasWorktree = worktrees.some((wt) => wt.branch === pr.headRefName);
      const marker = hasWorktree ? "\x1b[32m[✓]\x1b[0m" : "\x1b[90m[ ]\x1b[0m";
      const author = pr.author ? `@${pr.author.login}` : "unknown";

      const prNum = `#${pr.number}`.padEnd(6);
      const title = pr.title.length > 40 ? pr.title.substring(0, 37) + "..." : pr.title;
      const titlePadded = title.padEnd(43);
      const authorPadded = author.padEnd(20);

      console.log(`  ${prNum} ${marker}  ${titlePadded} ${authorPadded} ${pr.headRefName}`);
    });

    console.log("\n\x1b[90mLegend: [✓] = worktree exists\x1b[0m\n");
  } catch (err) {
    throw new Error(`Failed to list pull requests: ${err.message}`);
  }
}

async function checkoutPullRequest(prNumber) {
  const config = getConfig();

  console.log(`Fetching PR #${prNumber}...`);
  const pr = getPullRequestDetails(prNumber);
  const branchName = pr.headRefName;
  const baseBranch = pr.baseRefName;

  const worktrees = getWorktreeList();
  const existingWorktree = worktrees.find((wt) => wt.branch === branchName);

  if (existingWorktree) {
    console.log(`\x1b[33m⚠\x1b[0m  Worktree already exists for branch '${branchName}'`);
    console.log(`Switching to existing worktree...`);
    await switchWorktree(existingWorktree.path);
    return;
  }

  console.log(`Creating worktree from branch '${branchName}' (base: ${baseBranch})...`);

  try {
    execSync(`git rev-parse --verify ${branchName}`, { stdio: "ignore" });
  } catch (err) {
    console.log(`Branch '${branchName}' not found locally, fetching...`);
    try {
      execSync(`git fetch origin ${branchName}:${branchName}`, { stdio: "inherit" });
    } catch (fetchErr) {
      throw new Error(`Failed to fetch branch '${branchName}': ${fetchErr.message}`);
    }
  }

  const sanitizedName = sanitizeBranchName(branchName);
  const worktreePath = path.join(config.worktreeBaseDirAbs, `pirate-borg-${sanitizedName}`);

  if (fs.existsSync(worktreePath)) {
    throw new Error(`Worktree directory already exists: ${worktreePath}`);
  }

  const gitCmd = `git worktree add "${worktreePath}" ${branchName}`;

  try {
    execSync(gitCmd, { stdio: "inherit" });
    console.log(`\x1b[32m✓\x1b[0m Worktree created at: ${worktreePath}`);
  } catch (err) {
    throw new Error(`Failed to create worktree: ${err.message}`);
  }

  console.log(`\nSwitching Foundry symlink to: ${sanitizedName}`);
  await switchWorktree(worktreePath);
}

async function viewPullRequest(prNumber) {
  console.log(`Opening PR #${prNumber} in browser...`);
  openPullRequest(prNumber);
}
