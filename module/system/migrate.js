import { findCompendiumItem } from "../api/compendium.js";

export const migrate = () => {
  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) {
    return;
  }
  const currentVersion = game.settings.get("pirateborg", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = "v0.4.2";
  const needsMigration = currentVersion === null || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);

  console.log(`Current version: ${currentVersion}`);

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
    { permanent: true },
  );
  await migrateActors();

  game.settings.set("pirateborg", "systemMigrationVersion", game.system.data.version);

  ui.notifications.info(`PIRATE BORG System Migration to version ${game.system.data.version} completed!`, {
    permanent: true,
  });
};

const migrateActors = async () => {
  for (const actor of game.actors.values()) {
    try {
      const updateData = await migrateActorData(actor.data);
      console.log(`-- Migrating Actor ${actor.name}`, updateData);

      await actor.update(updateData, { enforceTypes: false });
    } catch (err) {
      err.message = `Failed migration for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }
  }
};

const migrateActorData = async (data) => {
  const updateData = {};

  // common
  if ("hp" in data.data) {
    updateData["data.attributes.hp"] = data.data.hp;
    updateData["data.-=hp"] = null;
  }

  // character
  if ("luck" in data.data) {
    updateData["data.attributes.luck"] = data.data.luck;
    updateData["data.-=luck"] = null;
  }
  if ("powerUses" in data.data) {
    updateData["data.attributes.rituals"] = data.data.powerUses;
    updateData["data.-=powerUses"] = null;
  }
  if ("extraResourceUses" in data.data) {
    updateData["data.attributes.extraResource"] = data.data.extraResourceUses;
    updateData["data.-=extraResourceUses"] = null;
  }

  // creature
  if ("armor" in data.data) {
    updateData["data.attributes.armor.description"] = data.data.armor.name;
    updateData["data.-=armor"] = null;
  }
  if ("attack" in data.data) {
    updateData["data.attributes.attack.description"] = data.data.attack.name;
    updateData["data.-=attack"] = null;
  }
  if ("morale" in data.data) {
    updateData["data.attributes.morale"] = data.data.morale;
    updateData["data.-=morale"] = null;
  }

  // ships
  if ("cargo" in data.data) {
    updateData["data.attributes.cargo"] = data.data.cargo;
    updateData["data.-=cargo"] = null;
  }
  if ("hull" in data.data) {
    updateData["data.attributes.hull"] = data.data.hull;
    updateData["data.-=hull"] = null;
  }
  if ("shanties" in data.data) {
    updateData["data.attributes.shanties"] = data.data.shanties;
    updateData["data.-=shanties"] = null;
  }
  if ("speed" in data.data) {
    updateData["data.attributes.speed"] = data.data.speed;
    updateData["data.-=speed"] = null;
  }
  if ("crew" in data.data) {
    updateData["data.attributes.crew"] = data.data.crew;
    updateData["data.-=crew"] = null;
  }
  if ("smallArmsDie" in data.data) {
    updateData["data.weapons.smallArms.die"] = data.data.smallArmsDie;
    updateData["data.-=smallArmsDie"] = null;
  }
  if ("smallArmsQuantity" in data.data) {
    updateData["data.weapons.smallArms.quantity"] = data.data.smallArmsQuantity;
    updateData["data.-=smallArmsQuantity"] = null;
  }
  if ("smallArmsWarning" in data.data) {
    updateData["data.weapons.smallArms.warning"] = data.data.smallArmsWarning;
    updateData["data.-=smallArmsWarning"] = null;
  }
  if ("broadsidesDie" in data.data) {
    updateData["data.weapons.broadsides.die"] = data.data.broadsidesDie;
    updateData["data.-=broadsidesDie"] = null;
  }
  if ("broadsidesQuantity" in data.data) {
    updateData["data.weapons.broadsides.quantity"] = data.data.broadsidesQuantity;
    updateData["data.-=broadsidesQuantity"] = null;
  }
  if ("broadsidesWarning" in data.data) {
    updateData["data.weapons.broadsides.warning"] = data.data.broadsidesWarning;
    updateData["data.-=broadsidesWarning"] = null;
  }
  if ("ramDie" in data.data) {
    updateData["data.weapons.ram.die"] = data.data.ramDie;
    updateData["data.-=ramDie"] = null;
  }
 
  if ("baseClass" in data.data) {
    const baseClass = data.data.baseClass;
    updateData["data.-=baseClass"] = null;
    const [compendium, item] = baseClass.split(";");
    if (compendium && item) {
      const baseClassItem = await findCompendiumItem(compendium, item);
      baseClassItem.isBaseClass = true;
      updateData.items = [baseClassItem.toObject(false)];
    }    
  }

  return updateData;
};
