import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { createMysticalMishapButton } from "../../automation/buttons.js";
import { withAdvancedAnimation, withAnimation, withButton, withTarget } from "../automation-outcome.js";
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

const getDescription = ({ isFailure = false }) => {
  switch (true) {
    case isFailure:
      return "PB.InvokableRitualFailure";
  }
};

const getButton = (outcome) => {
  switch (true) {
    case outcome.isFailure:
    case outcome.isFumble:
      return createMysticalMishapButton({ outcome });
  }
};

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
    withButton(getButton),
    withTarget({ actor }),
    withAnimation({ type: ANIMATION_TYPE.SIMPLE }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.INVOKE_RITUAL }),
  )();
