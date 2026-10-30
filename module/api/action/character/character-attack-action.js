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
    weapon,
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
    items: await getItems(weapon, ammo),
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

const getItems = async (weapon, ammo) => {
  const items = [weapon];
  if (ammo) {
    items.push(ammo);
  } else if (weapon.usesAmmo) {
    items.push(await PBItem.create({ type: "ammo", name: game.i18n.localize("PB.NoAmmo") }, { temporary: true }));
  }
  return items;
};

/**
 * @param {PBItem} weapon
 * @param {PBItem} ammo
 * @returns {Boolean}
 */
const isAttackValid = (weapon, ammo) => {
  const problem = trackAmmo() ? getAmmoProblem(weapon, ammo) : null;
  if (problem) {
    ui.notifications.error(game.i18n.format(problem, { ammo: ammo?.name }));
    return false;
  }
  return true;
};

/**
 * @param {PBItem} weapon
 * @param {PBItem} ammo
 * @returns {String|null} The localization key describing why the ammo can't be used, or null if it can
 */
const getAmmoProblem = (weapon, ammo) => {
  if (!weapon.usesAmmo) return null;
  if (!ammo) return "PB.NoAmmoEquipped";
  if (weapon.useAmmoDamage && !ammo.damageDie) return "PB.AmmoHasNoDamageDie";
  return null;
};
