import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { withAdvancedAnimation, withAnimation, withTarget } from "../automation-outcome.js";
import { testOutcome, withAsyncProps } from "../outcome.js";

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

export const createInvokeShantyOutcome = async ({ actor }) =>
  asyncPipe(
    testOutcome({
      type: "invoke-shanty",
      formula: "d20 + @abilities.skill.value",
      formulaLabel: `1d20 + ${game.i18n.localize("PB.AbilitySkill")}`,
      data: actor.getRollData(),
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
    }),
    withTarget({ actor }),
    withAnimation({ type: ANIMATION_TYPE.SIMPLE }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.SPELL }),
  )();
