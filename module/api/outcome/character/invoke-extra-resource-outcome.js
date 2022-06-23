import { asyncPipe } from "../../utils.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { testOutcome, withAsyncProps, withAutomations, withTarget } from "../outcome.js";

/**
 * @param {Boolean} isFumble
 * @param {Boolean} isCriticalSuccess
 * @param {Boolean} isSuccess
 * @param {Boolean} isFailure
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
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createInvokeExtraResourceOutcome = async ({ actor }) =>
  asyncPipe(
    testOutcome({
      type: "invoke-extra-resource",
      formula: actor.extraResourceTestFormula,
      formulaLabel: actor.extraResourceTestFormulaLabel,
      data: actor.getRollData(),
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
    }),
    withTarget({ actor }),
    withAutomations(ANIMATION_TYPE.SIMPLE)
  )();
