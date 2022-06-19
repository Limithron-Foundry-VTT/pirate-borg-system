import { asyncPipe } from "../../../../utils.js";
import { rollOutcome, withAsyncProps } from "../../outcome.js";

const getDescription = ({ hasGainAbility = false, hasLoseAbility = false, isUnchanged = false }) => {
  switch (true) {
    case hasGainAbility:
      return "PB.GetBetterGainAbility";
    case hasLoseAbility:
      return "PB.GetBetterLoseAbility";
    case isUnchanged:
      return "PB.Unchanged";
  }
};

export const createRollAbilityOutcome = async ({ ability, value }) =>
  asyncPipe(
    rollOutcome({
      formula: "1d6",
      formulaLabel: game.i18n.format("PB.GetBetterAbilityFormula", { ability, value }),
      title: ability,
    }),
    withAsyncProps({
      hasFailRoll: (outcome) => outcome.roll.total === 1 || outcome.roll.total < value,
      newValue: (outcome) => outcome.hasFailRoll ? Math.max(-3, value - 1) : Math.min(6, value + 1),
      hasGainAbility: (outcome) => outcome.newValue > value,
      hasLoseAbility: (outcome) => outcome.newValue < value,
      isUnchanged: (outcome) => outcome.newValue == value,
      description: (outcome) => game.i18n.format(getDescription(outcome), { ability }),
    }),
  )();
