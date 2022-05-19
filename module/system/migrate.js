export const migrate = () => {
  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) {
    return;
  }
  const currentVersion = game.settings.get("pirateborg", "systemMigrationVersion");

  console.log(`Current version: ${currentVersion}`);
  const NEEDS_MIGRATION_VERSION = "v0.0.0";
  const needsMigration = currentVersion === null || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
  if (!needsMigration) {
    console.log(`Version doesn't need migration.`);
    return;
  }
  console.log(`Migrating!`);
  migrateWorld();
};

const migrateWorld = async () => {
  ui.notifications.info(
    `Applying PIRATE BORG System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`,
    { permanent: true }
  );
  await migrateActors();
  await migrateItems();

  game.settings.set("pirateborg", "systemMigrationVersion", game.system.data.version);

  ui.notifications.info(`PIRATE BORG System Migration to version ${game.system.data.version} completed!`, { permanent: true });
};

const migrateActors = async () => {
  for (const a of game.actors.values()) {
    try {
      // future
    } catch (err) {
      err.message = `Failed migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }
};

const migrateItems = async () => {
  for (const item of game.items.values()) {
    try {
      // future
    } catch (err) {
      err.message = `Failed migration for Item ${item.name}: ${err.message}`;
      console.error(err);
    }
  }
};
