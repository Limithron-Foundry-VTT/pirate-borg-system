import { asyncPipe } from "../../utils.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { testOutcome, withAsyncProps, withAutomations, withButton, withTarget, withWhen } from "../outcome.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
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
      return "PB.DefendCrit";
    case isSuccess:
      return "PB.Dodge";
    case isFailure:
      return "PB.YouAreHit";
  }
};

/**
 * @param {Boolean} isFumble
 * @param {Boolean} isCriticalSuccess
 * @return {string}
 */
const getDescription = ({ isFumble = false, isCriticalSuccess = false }) => {
  switch (true) {
    case isFumble:
      return "PB.DefendFumbleText";
    case isCriticalSuccess:
      return "PB.DefendCritText";
  }
};

/**
 * @param {PBActor} actor
 * @param {Object} outcome
 * @param {String} damageFormula
 * @param {Token} targetToken
 * @return {String}
 */
const getDamageFormula = ({ actor, outcome, damageFormula = "", targetToken } = {}) => {
  const damage = outcome.isFumble ? `(${damageFormula}) * 2` : damageFormula;
  return targetToken?.actor.getScaledDamageFormula(actor, damage) ?? damage;
};

/**
 * @param {PBActor} actor
 * @param {Number} dr
 * @param {String} damageFormula
 * @param {String} armorFormula
 * @param {Token} targetToken
 * @return {Promise<Object>}
 */
export const createDefendOutcome = async ({ actor, dr = 12, damageFormula = "", armorFormula = "", targetToken }) =>
  asyncPipe(
    testOutcome({
      type: "defend",
      formula: `d20+@abilities.agility.value`,
      formulaLabel: game.i18n.localize(CONFIG.PB.abilities.agility),
      data: actor.getRollData(),
      dr,
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
      description: (outcome) => game.i18n.localize(getDescription(outcome)),
      armorFormula: () => armorFormula + (actor.equippedHat?.reduceDamage ? " + 1" : ""),
      damageFormula: (outcome) => getDamageFormula({ actor, outcome, damageFormula, targetToken }),
    }),
    withWhen(
      (outcome) => outcome.isFailure,
      withButton({
        title: game.i18n.localize("PB.RollDamageButton"),
        type: OUTCOME_BUTTON.TAKE_DAMAGE,
      })
    ),
    withTarget({ actor, targetToken }),
    withAutomations(ANIMATION_TYPE.DEFEND, ADVANCED_ANIMATION_TYPE.DEFEND)
  )();
