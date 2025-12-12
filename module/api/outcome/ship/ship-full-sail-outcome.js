import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { testOutcome, withAsyncProps, withAutomations, withTarget } from "../outcome.js";

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
      return "PB.OutcomeFumble";
    case isCriticalSuccess:
      return "PB.OutcomeCriticalSuccess";
    case isSuccess:
      return "PB.OutcomeSuccess";
    case isFailure:
      return "PB.OutcomeFailure";
  }
};

/**
 * @param {PBActor} actor
 * @param {PBActor} crew
 * @param {number} dr
 * @return {Promise<Object>}
 */
export const createFullSailOutcome = async ({ actor, crew, dr = 12 }) =>
  asyncPipe(
    testOutcome({
      type: "crew-action",
      formula: crew ? "d20 + @abilities.agility.value + @crew.abilities.agility.value" : "d20 + @abilities.agility.value",
      formulaLabel: crew ? "d20 + Ship Agility + PC Agility" : "d20 + Ship Agility",
      data: { ...actor.getRollData(), crew: crew?.getRollData() },
      dr,
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
    }),
    withTarget({ actor }),
    withAutomations(ANIMATION_TYPE.SIMPLE, ADVANCED_ANIMATION_TYPE.FULL_SAIL),
  )();
