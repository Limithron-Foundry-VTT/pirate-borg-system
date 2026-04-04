const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { promisify } = require("util");

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

const SYSTEM_JSON_PATH = path.join(process.cwd(), "system.json");

/** Paths included in system.zip (same as npm run pack). */
const ZIP_ENTRIES = [
  "CHANGELOG.md",
  "LICENSE.MB3PL",
  "LICENSE.MIT",
  "how-to-use-this-system.md",
  "README.md",
  "system.json",
  "template.json",
  "css",
  "fonts",
  "icons",
  "lang",
  "module",
  "packs",
  "templates",
  "tokens",
  "ui",
];

async function prepare(pluginConfig, context) {
  const { nextRelease, logger } = context;
  const { version } = nextRelease;

  const githubUrl = (pluginConfig.githubUrl || process.env.GITHUB_SERVER_URL || "https://github.com").replace(/\/$/, "");
  const repositoryPath = pluginConfig.repositoryPath || process.env.GITHUB_REPOSITORY || "Limithron-Foundry-VTT/pirate-borg-system";

  const systemContent = await readFile(SYSTEM_JSON_PATH, "utf8");
  const systemJson = JSON.parse(systemContent);

  systemJson.version = version;
  systemJson.manifest = `${githubUrl}/${repositoryPath}/releases/download/v${version}/system.json`;
  systemJson.download = `${githubUrl}/${repositoryPath}/releases/download/v${version}/system.zip`;

  await writeFile(SYSTEM_JSON_PATH, JSON.stringify(systemJson, null, 2) + "\n");
  logger.log(`Updated system.json to version ${version}`);
  logger.log(`manifest: ${systemJson.manifest}`);
  logger.log(`download: ${systemJson.download}`);

  await createSystemZip(systemJson, version, logger);
}

function createSystemZip(systemJson, version, logger) {
  const jsonForZip = systemJson.version === version ? systemJson : { ...systemJson, version };

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(path.join(process.cwd(), "system.zip"));
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      logger.log(`Created system.zip (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", reject);
    archive.pipe(output);

    for (const entry of ZIP_ENTRIES) {
      const full = path.join(process.cwd(), entry);
      if (!fs.existsSync(full)) {
        logger.warn(`Skipping missing path: ${entry}`);
        continue;
      }
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        archive.directory(full, entry);
      } else if (entry === "system.json") {
        archive.append(JSON.stringify(jsonForZip, null, 2) + "\n", { name: "system.json" });
      } else {
        archive.file(full, { name: entry });
      }
    }

    archive.finalize();
  });
}

/**
 * Remove temporary zip after @semantic-release/github has uploaded assets (success runs after publish).
 */
async function success(_pluginConfig, context) {
  const { logger } = context;
  try {
    const zipPath = path.join(process.cwd(), "system.zip");
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
      logger.log("Cleaned up system.zip");
    }
  } catch (error) {
    logger.warn(`Failed to clean up system.zip: ${error.message}`);
  }
}

module.exports = { prepare, success };
