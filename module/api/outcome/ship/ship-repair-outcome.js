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
 * @param {Number} dr
 * @return {Promise<Object>}
 */
export const createRepairOutcome = async ({ actor, crew, dr = 12 }) =>
  asyncPipe(
    testOutcome({
      type: "crew-action",
      formula: crew ? "d20 + @abilities.skill.value + @crew.abilities.presence.value" : "d20 + @abilities.skill.value",
      formulaLabel: crew ? "d20 + Crew Skill + PC Presence" : "d20 + Crew Skill",
      data: { ...actor.getRollData(), crew: crew?.getRollData() },
      dr,
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
    }),
    withTarget({ actor }),
    withWhen(
      (outcome) => outcome.isSuccess,
      withButton({
        title: game.i18n.localize("PB.ShipRepairButton"),
        type: OUTCOME_BUTTON.REPAIR_CREW_ACTION,
      })
    ),
    withAutomations(ANIMATION_TYPE.SIMPLE, ADVANCED_ANIMATION_TYPE.REPAIR)
  )();
