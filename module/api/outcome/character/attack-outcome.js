import { drawGunpowderFumble } from "../../compendium.js";
import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { testOutcome, withAsyncProps, withAutomations, withButton, withTarget, withWhen } from "../outcome.js";
import { OUTCOME_BUTTON } from "../../automation/outcome-chat-button.js";

/**
 * @param {Boolean} isFumble
 * @param {Boolean} isCriticalSuccess
 * @param {Boolean} isSuccess
 * @param {Boolean} isFailure
 * @return {string}
 */
const getTitle = ({ isFumble = false, isCriticalSuccess = false, isSuccess = false, isFailure = false }) => {
  switch (true) {
    case isFumble:
      return "PB.AttackFumble";
    case isCriticalSuccess:
      return "PB.AttackCrit";
    case isSuccess:
      return "PB.Hit";
    case isFailure:
      return "PB.Miss";
  }
};

/**
 *
 * @param {Boolean} isGunpowderWeapon
 * @param {Boolean} isFumble
 * @param {Boolean} isCriticalSuccess
 * @return {Promise<string|RollTableDraw>}
 */
const getDescription = async ({ isGunpowderWeapon = false, isFumble = false, isCriticalSuccess = false }) => {
  switch (true) {
    case isFumble && isGunpowderWeapon:
      return drawGunpowderFumble();
    case isFumble:
      return "PB.AttackFumbleText";
    case isCriticalSuccess:
      return "PB.AttackCritText";
  }
};

/**
 * @param {PBActor} actor
 * @param {Object} outcome
 * @param {PBItem} weapon
 * @param {PBItem} ammo
 * @param {Token} targetToken
 * @return {String}
 */
const getDamageFormula = ({ actor, outcome, weapon, ammo, targetToken } = {}) => {
  let damageFormula = weapon.useAmmoDamage ? ammo.damageDie : weapon.damageDie;
  damageFormula = outcome.isCriticalSuccess ? `(${weapon.damageDie}) * 2` : damageFormula;
  damageFormula = outcome.isCriticalSuccess && weapon.critExtraDamage ? `(${damageFormula}) + ${weapon.critExtraDamage}` : damageFormula;
  
  // Add damage modifier if present (ActiveEffects already modified the value)
  const damageModifier = actor.attributes?.combat?.damageModifier || 0;
  if (damageModifier !== 0) {
    damageFormula = `(${damageFormula}) + ${damageModifier}`;
  }
  
  return actor.getScaledDamageFormula(targetToken?.actor, damageFormula);
};

/**
 * @param {PBActor} actor
 * @param {Number} dr
 * @param {PBItem} weapon
 * @param {PBItem} ammo
 * @param {Token} targetToken
 * @param {String} armorFormula
 * @return {Promise<Object>}
 */
export const createAttackOutcome = async ({ actor, dr = 12, weapon, ammo, targetToken, armorFormula = "" }) =>
  asyncPipe(
    testOutcome({
      type: "attack",
      armorFormula,
      formula: `d20+@abilities.${weapon.attackAbility}.value${actor.attributes?.combat?.attackModifier ? '+@attributes.combat.attackModifier' : ''}`,
      formulaLabel: `d20 + ${game.i18n.localize(CONFIG.PB.abilityKey[weapon.attackAbility])}${actor.attributes?.combat?.attackModifier ? ` + Attack Modifier (${actor._getAttackEffectDetails()})` : ''}`,
      data: actor.getRollData(),
      dr,
      item: weapon?.id,
      isGunpowderWeapon: weapon?.isGunpowderWeapon,
    }),
    withTarget({ actor, targetToken }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
      description: async (outcome) => game.i18n.localize(await getDescription(outcome)),
      damageFormula: (outcome) => getDamageFormula({ actor, outcome, weapon, ammo, targetToken }),
    }),
    withWhen(
      (outcome) => outcome.isSuccess,
      withButton({
        title: game.i18n.localize("PB.RollDamageButton"),
        type: OUTCOME_BUTTON.INFLICT_DAMAGE,
      })
    ),
    withAutomations(ANIMATION_TYPE.ATTACK, ADVANCED_ANIMATION_TYPE.ITEM)
  )();
