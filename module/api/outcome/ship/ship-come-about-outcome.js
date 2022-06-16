import { asyncPipe } from "../../../utils.js";
import { withAdvancedAnimation, withAnimation, withTarget } from "../automation-outcome.js";
import { outcome, withAsyncProps, withRoll, withTest } from "../outcome.js";

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

export const createComeAboutOutcome = async ({ actor, crew, dr = 12 }) =>
  asyncPipe(
    outcome({ type: "crew-action" }),
    withRoll({
      formula: crew ? "d20 + @abilities.agility.value + @crew.abilities.strength.value" : "d20 + @abilities.agility.value",
      formulaLabel: crew ? "d20 + Ship Agility + PC Strength" : "d20 + Ship Agility",
      data: { ...actor.getRollData(), crew: crew?.getRollData() },
    }),
    withTest({ dr }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
    }),
    withTarget({ actor }),
    withAnimation({ type: ANIMATION_TYPE.SIMPLE }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.COME_ABOUT }),
  )();
