import { showAttackDialog } from "../../../dialog/attack-dialog.js";
import { PBItem } from "../../../item/item.js";
import { trackAmmo } from "../../../system/settings.js";
import { createAttackOutcome } from "../../outcome/character/attack-outcome.js";
import { showGenericCard } from "../../../chat-message/generic-card.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} weapon
 * @returns {Promise.<Object>}
 */
export const characterAttackAction = async (actor, weapon) => {
  /** @type {PBItem} */
  const ammo = actor.items.get(weapon.ammoId);

  if (!isAttackValid(weapon, ammo)) return;

  const { attackDR, targetArmor, targetToken } = await showAttackDialog({
    actor,
  });

  const outcome = await createAttackOutcome({
    actor,
    weapon,
    ammo,
    dr: attackDR,
    targetToken,
    armorFormula: targetArmor,
  });

  await handleWeaponReloading(weapon);
  await decrementWeaponAmmo(actor, weapon);

  await showGenericCard({
    actor,
    title: `${game.i18n.localize(weapon.isRanged ? "PB.WeaponTypeRanged" : "PB.WeaponTypeMelee")} ${game.i18n.localize("PB.Attack")}`,
    outcomes: [outcome],
    items: getItems(weapon, ammo),
    description: weapon.useAmmoDamage ? ammo.description : "",
    target: targetToken,
  });

  return outcome;
};

/**
 * @param {PBItem} weapon
 * @returns {Promise}
 */
const handleWeaponReloading = async (weapon) => {
  if (!weapon?.needsReloading) {
    return;
  }
  const reloadTime = weapon.reloadTime || 1;
  await weapon.setLoadingCount(reloadTime);
};

/**
 * @param {PBActor} actor
 * @param {PBItem} weapon
 * @returns {Promise}
 */
const decrementWeaponAmmo = async (actor, weapon) => {
  if (weapon.usesAmmo && weapon.ammoId && trackAmmo()) {
    /** @type {PBItem} */
    const ammo = actor.items.get(weapon.ammoId);
    if (ammo) {
      const quantity = ammo.quantity - 1;
      if (quantity > 0) {
        await ammo.setQuantity(quantity);
      } else {
        await actor.deleteEmbeddedDocuments("Item", [ammo.id]);
      }
    }
  }
};

const getItems = (weapon, ammo) => {
  const items = [weapon];
  if (ammo) {
    items.push(ammo);
  } else if (weapon.usesAmmo) {
    items.push(PBItem.create({ type: "ammo", name: game.i18n.localize("PB.NoAmmo") }));
  }
  return items;
};

/**
 * @param {PBItem} weapon
 * @param {PBItem} ammo
 * @returns {Boolean}
 */
const isAttackValid = (weapon, ammo) => {
  if (!isAmmoValid(weapon, ammo)) {
    ui.notifications.error(game.i18n.format("PB.NoAmmoEquipped"));
    return false;
  }
  return true;
};

/**
 * @param {PBItem} weapon
 * @param {PBItem} ammo
 * @returns {Boolean}
 */
const isAmmoValid = (weapon, ammo) => {
  if (!weapon.useAmmoDamage) {
    return true;
  }
  if (!weapon.hasAmmo) {
    return false;
  }

  if (!ammo.damageDie) {
    return false;
  }
  return true;
};
