import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { testOutcome, withAsyncProps, withAutomations, withButton, withTarget, withWhen } from "../outcome.js";
import { OUTCOME_BUTTON } from "../../automation/outcome-chat-button.js";

/**
 * @param {String} isFumble
 * @param {String} isCriticalSuccess
 * @param {String} isSuccess
 * @param {String} isFailure
 * @return {String}
 */
const getTitle = ({ isFumble, isCriticalSuccess, isSuccess, isFailure }) => {
  switch (true) {
    case isFumble:
      return "PB.InvokableFumble";
    case isCriticalSuccess:
      return "PB.InvokableCriticalSuccess";
    case isSuccess:
      return "PB.InvokableSuccess";
    case isFailure:
      return "PB.InvokableFailure";
  }
};

/**
 * @param {Boolean} isFailure
 * @return {String}
 */
const getDescription = ({ isFailure = false }) => {
  switch (true) {
    case isFailure:
      return "PB.InvokableRitualFailure";
  }
};

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createInvokeRitualOutcome = async ({ actor }) =>
  asyncPipe(
    testOutcome({
      type: "invoke-ritual",
      formula: "d20+@abilities.spirit.value",
      formulaLabel: `1d20 + ${game.i18n.localize("PB.AbilitySpirit")}`,
      data: actor.getRollData(),
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
      description: (outcome) => game.i18n.localize(getDescription(outcome)),
    }),
    withWhen(
      (outcome) => outcome.isFailure,
      withButton({
        title: game.i18n.localize("PB.InvokableRitualFailureButton"),
        type: OUTCOME_BUTTON.MYSTICAL_MISHAP,
      })
    ),
    withTarget({ actor }),
    withAutomations(ANIMATION_TYPE.SIMPLE, ADVANCED_ANIMATION_TYPE.INVOKE_RITUAL)
  )();
