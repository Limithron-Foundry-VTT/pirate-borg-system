export const migrate = () => {
  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) {
    return;
  }
  const currentVersion = game.settings.get("pirateborg", "systemMigrationVersion");

  console.log(`Current version: ${currentVersion}`);
  const NEEDS_MIGRATION_VERSION = "0.2.0";
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

  ui.notifications.info(`MÖRK BORG System Migration to version ${game.system.data.version} completed!`, { permanent: true });
};

const migrateActors = async () => {
  for (const a of game.actors.values()) {
    try {
      const updateData = migrateActorData(a.data);
      if (!isObjectEmpty(updateData)) {
        console.log(`Migrating Actor entity ${a.name}`);
        await a.update(updateData, { enforceTypes: false });
      }
    } catch (err) {
      err.message = `Failed migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }
};

const migrateActorData = () => {
  const updateData = {};
  // for future migration
  return updateData;
};

const migrateItems = async () => {
  for (const item of game.items.values()) {
    try {
      const updateData = migrateItemData(item.data);
      if (!isObjectEmpty(updateData)) {
        console.log(`Migrating Item entity ${item.name}`);
        await item.update(updateData, { enforceTypes: false });
      }
    } catch (err) {
      err.message = `Failed migration for Item ${item.name}: ${err.message}`;
      console.error(err);
    }
  }
};

const migrateItemData = () => {
  const updateData = {};
  // for future migration
  return updateData;
};
