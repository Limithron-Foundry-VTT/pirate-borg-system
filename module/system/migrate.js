import { findCompendiumItem } from "../api/compendium.js";
import { getSystemMigrationVersion, setSystemMigrationVersion } from "./settings.js";
import { getSystemVersion } from "../api/utils.js";

export const migrate = async () => {
  // Determine whether a system migration is required and feasible
  if (!game.user.isGM) {
    return;
  }
  const currentVersion = getSystemMigrationVersion();

  const NEEDS_MIGRATION_VERSION = "v0.4.2";
  const EFFECT_CLONE_MIGRATION_VERSION = "v1.8.2";
  const needsMigration = currentVersion === null || foundry.utils.isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);
  const needsEffectCloneMigration = !currentVersion || foundry.utils.isNewerVersion(EFFECT_CLONE_MIGRATION_VERSION, currentVersion);

  console.log(`Current version: ${currentVersion}`);

  if (!needsMigration && !needsEffectCloneMigration) {
    console.log(`Version doesn't need migration.`);
    return;
  }
  console.log(`Migrating!`);
  if (needsMigration) {
    await migrateWorld();
  }
  if (needsEffectCloneMigration) {
    await migrateEmbeddedItemEffectClones();
    await migrateOwnedItemEffectTransfer();
    await setSystemMigrationVersion(EFFECT_CLONE_MIGRATION_VERSION);
  }
};

const isEmbeddedItemEffectClone = (actor, effect) => {
  const refs = [effect.origin, effect.flags?.core?.sourceId].filter(Boolean);
  for (const ref of refs) {
    if (actor.items.some((item) => item.uuid === ref)) return true;
    const resolveUuid = globalThis.fromUuidSync ?? foundry.utils.fromUuidSync;
    const doc = typeof resolveUuid === "function" ? resolveUuid(ref) : null;
    if (doc?.documentName === "Item" && doc.parent === actor) return true;
  }
  return false;
};

const deleteActorItemEffectClones = async (actor) => {
  const ids = actor.effects.filter((effect) => isEmbeddedItemEffectClone(actor, effect)).map((effect) => effect.id);
  if (!ids.length) return;
  await actor.deleteEmbeddedDocuments("ActiveEffect", ids);
};

const migrateEmbeddedItemEffectClones = async () => {
  ui.notifications.info(`Applying PIRATE BORG item effect clone cleanup.`, { permanent: true });

  for (const actor of game.actors.contents) {
    try {
      await deleteActorItemEffectClones(actor);
    } catch (err) {
      err.message = `Failed item effect clone cleanup for Actor ${actor.name}: ${err.message}`;
      console.error(err);
    }
  }

  for (const scene of game.scenes.contents) {
    for (const token of scene.tokens.contents) {
      const actor = token.actor;
      if (!actor || token.actorLink) continue;
      try {
        await deleteActorItemEffectClones(actor);
      } catch (err) {
        err.message = `Failed item effect clone cleanup for Token ${token.name}: ${err.message}`;
        console.error(err);
      }
    }
  }

  ui.notifications.info(`PIRATE BORG item effect clone cleanup completed.`, { permanent: true });
};

const shouldEnableItemEffectTransfer = (item) => item.type === CONFIG.PB.itemTypes.feature || CONFIG.PB.equippableItemTypes.includes(item.type);

const enableItemEffectTransfer = async (item) => {
  if (!shouldEnableItemEffectTransfer(item)) return;
  const updates = [];
  for (const effect of item.effects) {
    if (effect.transfer) continue;
    updates.push({ _id: effect.id, transfer: true });
  }
  if (updates.length) {
    await item.updateEmbeddedDocuments("ActiveEffect", updates);
  }
};

const migrateOwnedItemEffectTransfer = async () => {
  for (const item of game.items.contents) {
    try {
      await enableItemEffectTransfer(item);
    } catch (err) {
      err.message = `Failed effect transfer migration for Item ${item.name}: ${err.message}`;
      console.error(err);
    }
  }

  for (const actor of game.actors.contents) {
    for (const item of actor.items) {
      try {
        await enableItemEffectTransfer(item);
      } catch (err) {
        err.message = `Failed effect transfer migration for Item ${item.name} on Actor ${actor.name}: ${err.message}`;
        console.error(err);
      }
    }
  }

  for (const scene of game.scenes.contents) {
    for (const token of scene.tokens.contents) {
      const actor = token.actor;
      if (!actor || token.actorLink) continue;
      for (const item of actor.items) {
        try {
          await enableItemEffectTransfer(item);
        } catch (err) {
          err.message = `Failed effect transfer migration for Item ${item.name} on Token ${token.name}: ${err.message}`;
          console.error(err);
        }
      }
    }
  }
};

const migrateWorld = async () => {
  ui.notifications.info(
    `Applying PIRATE BORG System Migration for version ${getSystemVersion()}. Please be patient and do not close your game or shut down your server.`,
    { permanent: true },
  );
  await migrateActors();

  setSystemMigrationVersion(getSystemVersion());

  ui.notifications.info(`PIRATE BORG System Migration to version ${getSystemVersion()} completed!`, {
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
