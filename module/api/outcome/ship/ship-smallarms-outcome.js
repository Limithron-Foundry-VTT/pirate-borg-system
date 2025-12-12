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
 * @return {String}
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
 * @param {Boolean} isFumble
 * @param {Boolean} isCriticalSuccess
 * @return {String}
 */
const getDescription = ({ isFumble = false, isCriticalSuccess = false }) => {
  switch (true) {
    case isFumble:
      return "PB.ShipDealDamageFumble";
    case isCriticalSuccess:
      return "PB.ShipDealDamageCritical";
  }
};

/**
 * @param {PBActor} actor
 * @param {Object} outcome
 * @param {Token} targetToken
 * @return {String}
 */
const getDamageFormula = ({ actor, outcome, targetToken }) => {
  const damageFormula = outcome.isCriticalSuccess ? `(${actor.smallArmsDie}) * 2` : actor.smallArmsDie;
  return actor.getScaledDamageFormula(targetToken?.actor, damageFormula);
};

/**
 * @param {PBActor} actor
 * @param {PBActor} crew
 * @param {Number} dr
 * @param {String} armorFormula
 * @param {Token} targetToken
 * @return {Promise<Object>}
 */
export const createSmallarmsOutcome = async ({ actor, crew, dr = 12, armorFormula = "", targetToken }) =>
  asyncPipe(
    testOutcome({
      type: "crew-attack",
      armorFormula,
      formula: crew ? "d20 + @abilities.skill.value + @crew.abilities.presence.value" : "d20 + @abilities.skill.value",
      formulaLabel: crew ? "d20 + Crew Skill + PC Presence" : "d20 + Crew Skill",
      data: { ...actor.getRollData(), crew: crew?.getRollData() },
      dr,
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
      description: (outcome) => game.i18n.localize(getDescription(outcome)),
      damageFormula: (outcome) => getDamageFormula({ actor, outcome, targetToken }),
    }),
    withWhen(
      (outcome) => outcome.isSuccess,
      withButton({
        title: game.i18n.localize("PB.RollDamageButton"),
        type: OUTCOME_BUTTON.INFLICT_DAMAGE,
      }),
    ),
    withTarget({ actor, targetToken }),
    withAutomations(ANIMATION_TYPE.ATTACK, ADVANCED_ANIMATION_TYPE.SMALLARMS),
  )();
