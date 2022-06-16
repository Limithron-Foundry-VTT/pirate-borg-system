import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { withAdvancedAnimation, withAnimation, withTarget } from "../automation-outcome.js";
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

const getDescription = ({ isFumble = false, isFailure = false }) => {
  switch (true) {
    case isFumble:
      return "PB.InvokableRelicFumble";
    case isFailure:
      return "PB.InvokableRelicFailure";
  }
};

export const createTestRelicOutcome = async ({ actor }) =>
  asyncPipe(
    outcome({ type: "test-relic" }),
    withRoll({
      formula: "d20+@abilities.spirit.value",
      formulaLabel: `1d20 + ${game.i18n.localize("PB.AbilitySpirit")}`,
      data: actor.getRollData(),
    }),
    withTest(),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
      description: (outcome) => game.i18n.localize(getDescription(outcome)),
    }),
    withTarget({ actor }),
    withAnimation({ type: ANIMATION_TYPE.SIMPLE }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.SPELL }),
  )();
