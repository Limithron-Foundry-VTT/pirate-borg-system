import { asyncPipe } from "../../../utils.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { withAnimation, withTarget } from "../automation-outcome.js";
import { outcome, withAsyncProps, withRoll, withTest } from "../outcome.js";

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

export const createInvokeExtraResourceOutcome = async ({ actor }) =>
  asyncPipe(
    outcome({ type: "invoke-extra-resource" }),
    withRoll({
      formula: actor.getExtraResourceTestFormula(),
      formulaLabel: actor.getExtraResourceTestFormulaLabel(),
      data: actor.getRollData(),
    }),
    withTest(),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
    }),
    withTarget({ actor }),
    withAnimation({ type: ANIMATION_TYPE.SIMPLE }),
  )();
