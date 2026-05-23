import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { loadEnv, resolveAbsolutePath } from "./foundry-api.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUPPORTED_VERSIONS = ["12", "13", "14"];

const argv = yargs(hideBin(process.argv))
  .command(linkCommand())
  .command(statusCommand())
  .demandCommand(1, "Please provide a command: link or status")
  .version(false)
  .help()
  .alias("help", "h").argv;

void argv;

function linkCommand() {
  return {
    command: "link [version]",
    describe: "Create or update REFERENCE symlinks for Foundry VTT installations",
    builder: (y) =>
      y
        .positional("version", {
          describe: "Foundry version to link (12, 13, 14). Omit to link all configured versions.",
          type: "string",
        })
        .option("dry-run", {
          type: "boolean",
          default: false,
          describe: "Preview symlink operations without writing",
        }),
    handler: (args) => {
      try {
        runLink(args.version || null, Boolean(args.dryRun));
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m ${err.message}`);
        process.exit(1);
      }
    },
  };
}

function statusCommand() {
  return {
    command: "status",
    describe: "Show current state of REFERENCE symlinks",
    handler: () => {
      try {
        runStatus();
      } catch (err) {
        console.error(`\x1b[31m✗\x1b[0m ${err.message}`);
        process.exit(1);
      }
    },
  };
}

function getConfig() {
  loadEnv();

  const referenceDir = process.env.FOUNDRY_REFERENCE_DIR || "./REFERENCE";
  const referenceDirAbs = resolveAbsolutePath(referenceDir, REPO_ROOT);

  const versions = SUPPORTED_VERSIONS.map((v) => ({
    version: v,
    installDir: process.env[`FOUNDRY${v}_INSTALL_DIR`] || "",
  }));

  return { referenceDirAbs, versions };
}

function runLink(versionFilter, dryRun) {
  const config = getConfig();
  const entries = config.versions.filter((e) => e.installDir && (!versionFilter || e.version === versionFilter));

  if (entries.length === 0) {
    if (versionFilter) {
      const configured = config.versions.filter((e) => e.installDir).map((e) => e.version);
      const hint = configured.length > 0 ? `Configured versions: ${configured.join(", ")}` : `No FOUNDRY{N}_INSTALL_DIR variables set in .env`;
      throw new Error(`Version ${versionFilter} not configured. Set FOUNDRY${versionFilter}_INSTALL_DIR in .env.\n${hint}`);
    }
    throw new Error("No FOUNDRY{N}_INSTALL_DIR variables configured in .env.");
  }

  if (!dryRun) {
    fs.mkdirSync(config.referenceDirAbs, { recursive: true });
  }

  for (const { version, installDir } of entries) {
    const targetAbs = resolveAbsolutePath(installDir, REPO_ROOT);
    const symlinkPath = path.join(config.referenceDirAbs, version);

    if (dryRun) {
      console.log(`\x1b[90m[dry-run]\x1b[0m ${symlinkPath} -> ${targetAbs}`);
      continue;
    }

    if (!fs.existsSync(targetAbs)) {
      console.warn(`\x1b[33m⚠\x1b[0m  Skipping v${version}: target not found: ${targetAbs}`);
      continue;
    }

    if (isSymlink(symlinkPath)) {
      fs.unlinkSync(symlinkPath);
    } else if (fs.existsSync(symlinkPath)) {
      throw new Error(`${symlinkPath} exists and is not a symlink — refusing to overwrite`);
    }

    fs.symlinkSync(targetAbs, symlinkPath);
    console.log(`\x1b[32m✓\x1b[0m Linked v${version}: ${symlinkPath} -> ${targetAbs}`);
  }

  if (dryRun) {
    console.log("\x1b[90m(dry run — no changes made)\x1b[0m");
  }
}

function runStatus() {
  const config = getConfig();

  for (const { version, installDir } of config.versions) {
    const symlinkPath = path.join(config.referenceDirAbs, version);
    const configured = installDir ? resolveAbsolutePath(installDir, REPO_ROOT) : null;
    const label = `v${version}`;

    if (!configured) {
      console.log(`\x1b[90m-\x1b[0m  ${label}: not configured (no FOUNDRY${version}_INSTALL_DIR in .env)`);
      continue;
    }

    if (!isSymlink(symlinkPath)) {
      console.log(`\x1b[33m○\x1b[0m  ${label}: not linked  (run 'foundry:reference:link' to create)  configured: ${configured}`);
      continue;
    }

    const rawTarget = fs.readlinkSync(symlinkPath);
    const resolvedTarget = path.resolve(path.dirname(symlinkPath), rawTarget);
    const targetExists = fs.existsSync(symlinkPath);

    if (!targetExists) {
      console.log(`\x1b[31m✗\x1b[0m ${label}: dead symlink -> ${resolvedTarget}`);
    } else if (resolvedTarget !== configured) {
      console.log(`\x1b[33m⚠\x1b[0m  ${label}: linked -> ${resolvedTarget}  (expected: ${configured})`);
    } else {
      console.log(`\x1b[32m✓\x1b[0m ${label}: ${symlinkPath} -> ${resolvedTarget}`);
    }
  }
}

function isSymlink(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}
