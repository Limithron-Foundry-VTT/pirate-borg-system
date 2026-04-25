import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { getConfig, promptContinueIfActive, resolveAbsolutePath } from "./foundry-api.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const argv = yargs(hideBin(process.argv))
  .command(backupCommand())
  .command(installDevCommand())
  .command(restoreCommand())
  .demandCommand(1, "Please provide a command: backup, install-dev, or restore")
  .help()
  .alias("help", "h").argv;

void argv;

function backupCommand() {
  return {
    command: "backup",
    describe: "Backup remote Foundry system",
    builder: (y) =>
      y.option("dry-run", {
        type: "boolean",
        default: false,
        describe: "Preview rsync operations without writing files",
      }),
    handler: async (args) => {
      try {
        ensureRsyncAvailable();
        await runBackup(Boolean(args.dryRun));
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m ${err.message}`);
        process.exit(1);
      }
    },
  };
}

function installDevCommand() {
  return {
    command: "install-dev",
    describe: "Sync local repo into remote Foundry system directory",
    builder: (y) =>
      y.option("dry-run", {
        type: "boolean",
        default: false,
        describe: "Preview rsync operations without writing files",
      }),
    handler: async (args) => {
      try {
        ensureRsyncAvailable();
        await runInstallDev(Boolean(args.dryRun));
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m ${err.message}`);
        process.exit(1);
      }
    },
  };
}

function restoreCommand() {
  return {
    command: "restore <backupPath>",
    describe: "Restore remote Foundry system from a local backup",
    builder: (y) =>
      y
        .positional("backupPath", {
          describe: "Path to backup directory created by backup command",
          type: "string",
        })
        .option("delete", {
          type: "boolean",
          default: false,
          describe: "Delete files on remote that are not present in backup",
        })
        .option("dry-run", {
          type: "boolean",
          default: false,
          describe: "Preview rsync operations without writing files",
        }),
    handler: async (args) => {
      try {
        ensureRsyncAvailable();
        await runRestore(args.backupPath, Boolean(args.delete), Boolean(args.dryRun));
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m ${err.message}`);
        process.exit(1);
      }
    },
  };
}

async function runBackup(dryRun) {
  const config = getConfig();
  validateRemoteConfig(config);

  const timestamp = formatTimestamp(new Date());
  const backupDir = path.join(config.foundryBackupRootAbs, timestamp);
  const systemBackupDir = path.join(backupDir, "systems", config.systemName);

  fs.mkdirSync(systemBackupDir, { recursive: true });

  const remoteSystemPath = getRemoteSystemPath(config);
  runRsync({
    source: buildRemoteSource(config.foundryRemoteSsh, remoteSystemPath),
    destination: ensureLocalPathWithSlash(systemBackupDir),
    dryRun,
  });

  if (!dryRun) {
    const manifest = {
      createdAt: new Date().toISOString(),
      systemName: config.systemName,
      remoteSsh: config.foundryRemoteSsh,
      remoteDataDir: config.foundryRemoteDataDir,
      systemPath: remoteSystemPath,
    };
    fs.writeFileSync(path.join(backupDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  }

  console.log(`\x1b[32m✓\x1b[0m Backup ${dryRun ? "preview complete" : "complete"}: ${backupDir}`);
}

async function runInstallDev(dryRun) {
  const config = getConfig();
  validateRemoteConfig(config);

  const canProceed = await promptContinueIfActive(config.foundryApiEndpoint);
  if (!canProceed) {
    process.exit(2);
  }

  const remoteSystemPath = getRemoteSystemPath(config);
  runRsync({
    source: ensureLocalPathWithSlash(REPO_ROOT),
    destination: buildRemoteDestination(config.foundryRemoteSsh, remoteSystemPath),
    dryRun,
    deleteMode: true,
    excludes: [
      ".git/",
      ".github/",
      ".cursor/",
      ".idea/",
      ".vscode/",
      "node_modules/",
      ".env",
      "system.zip",
      ".foundry-backups/",
    ],
  });

  console.log(`\x1b[32m✓\x1b[0m Dev install ${dryRun ? "preview complete" : "complete"}.`);
  console.log("\x1b[90mTip: run 'npm run sass' and 'npm run build:db' before installing for fresh CSS and packs.\x1b[0m");
}

async function runRestore(backupPathArg, deleteMode, dryRun) {
  const config = getConfig();
  validateRemoteConfig(config);

  const backupPath = resolveAbsolutePath(backupPathArg);
  if (!fs.existsSync(backupPath) || !fs.statSync(backupPath).isDirectory()) {
    throw new Error(`Backup path does not exist or is not a directory: ${backupPath}`);
  }

  const canProceed = await promptContinueIfActive(config.foundryApiEndpoint);
  if (!canProceed) {
    process.exit(2);
  }

  const manifest = readManifestIfPresent(backupPath);
  const systemName = manifest?.systemName || config.systemName;
  const systemBackupDir = path.join(backupPath, "systems", systemName);
  if (!fs.existsSync(systemBackupDir)) {
    throw new Error(`Backup is missing system directory: ${systemBackupDir}`);
  }

  const remoteSystemPath = getRemoteSystemPath({ ...config, systemName });
  runRsync({
    source: ensureLocalPathWithSlash(systemBackupDir),
    destination: buildRemoteDestination(config.foundryRemoteSsh, remoteSystemPath),
    dryRun,
    deleteMode,
  });

  console.log(`\x1b[32m✓\x1b[0m Restore ${dryRun ? "preview complete" : "complete"} from ${backupPath}`);
}

function ensureRsyncAvailable() {
  const check = spawnSync("rsync", ["--version"], { stdio: "ignore" });
  if (check.status !== 0) {
    throw new Error("rsync is required but was not found in PATH.");
  }
}

function validateRemoteConfig(config) {
  if (!config.foundryRemoteSsh) {
    throw new Error("Missing FOUNDRY_REMOTE_SSH in .env");
  }
  if (!config.foundryRemoteDataDir) {
    throw new Error("Missing FOUNDRY_REMOTE_DATA_DIR in .env");
  }
}

function getRemoteSystemPath(config) {
  return joinRemotePath(config.foundryRemoteDataDir, "systems", config.systemName);
}

function joinRemotePath(...parts) {
  const cleaned = parts.map((part, index) => {
    if (index === 0) return String(part).replace(/\/+$/g, "");
    return String(part).replace(/^\/+/g, "").replace(/\/+$/g, "");
  });
  return cleaned.join("/");
}

function buildRemoteSource(sshTarget, remotePath) {
  return `${sshTarget}:${remotePath}/`;
}

function buildRemoteDestination(sshTarget, remotePath) {
  return `${sshTarget}:${remotePath}/`;
}

function ensureLocalPathWithSlash(localPath) {
  return path.resolve(localPath) + path.sep;
}

function runRsync({ source, destination, dryRun, deleteMode = false, excludes = [] }) {
  const args = ["-a"];
  if (deleteMode) args.push("--delete");
  if (dryRun) args.push("-n");

  for (const pattern of excludes) {
    args.push("--exclude", pattern);
  }

  args.push(source, destination);

  console.log(`\x1b[90m$ rsync ${args.join(" ")}\x1b[0m`);
  const result = spawnSync("rsync", args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("rsync command failed");
  }
}

function readManifestIfPresent(backupPath) {
  const manifestPath = path.join(backupPath, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    throw new Error(`Failed to parse backup manifest: ${manifestPath}`);
  }
}

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}
