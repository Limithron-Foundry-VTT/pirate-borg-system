import { drawGunpowderFumble } from "../../../compendium.js";
import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { createInflictDamageButton } from "../../automation/buttons.js";
import { withAdvancedAnimation, withAnimation, withButton, withTarget } from "../automation-outcome.js";
import { outcome, withAsyncProps, withRoll, withTest } from "../outcome.js";

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

const getDescription = async ({ isGunpowderWeapon = false, isFumble = false, isCriticalSuccess = false }) => {
  switch (true) {
    case isFumble:
      return "PB.AttackFumbleText";
    case isCriticalSuccess && isGunpowderWeapon:
      return await drawGunpowderFumble();
    case isCriticalSuccess:
      return "PB.AttackCritText";
  }
};

const getButton = (outcome) => {
  switch (true) {
    case outcome.isCriticalSuccess:
    case outcome.isSuccess:
      return createInflictDamageButton({ outcome });
  }
};

const getDamageFormula = ({ actor, outcome, weapon, ammo, targetToken } = {}) => {
  let damageFormula = weapon.useAmmoDamage ? ammo.damageDie : weapon.damageDie;
  damageFormula = outcome.isCriticalSuccess ? `(${weapon.damageDie}) * 2` : damageFormula;
  damageFormula = weapon.critExtraDamage ? `(${damageFormula}) + ${weapon.critExtraDamage}` : damageFormula;
  return actor.getScaledDamageFormula(targetToken?.actor, damageFormula);
};

export const createAttackOutcome = async ({ actor, dr = 12, weapon, ammo, targetToken, armorFormula = "" }) =>
  asyncPipe(
    outcome({ type: "attack", armorFormula }),
    withRoll({
      formula: `d20+@abilities.${weapon.attackAbility}.value`,
      formulaLabel: `d20 + ${game.i18n.localize(CONFIG.PB.abilities[weapon.attackAbility])}`,
      data: actor.getRollData(),
    }),
    withTest({ dr }),
    withTarget({ actor, targetToken }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
      description: async (outcome) => game.i18n.localize(await getDescription(outcome)),
      damageFormula: (outcome) => getDamageFormula({ actor, outcome, weapon, ammo, targetToken }),
    }),
    withButton(getButton),
    withAnimation({ type: ANIMATION_TYPE.ATTACK }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.ITEM, option: { item: weapon?.id } }),
  )();
