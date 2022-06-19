import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { createShipRepairButton } from "../../automation/buttons.js";
import { withAdvancedAnimation, withAnimation, withButton, withTarget } from "../automation-outcome.js";
import { testOutcome, withAsyncProps } from "../outcome.js";

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

const getButton = (outcome) => {
  switch (true) {
    case outcome.isCriticalSuccess:
    case outcome.isSuccess:
      return createShipRepairButton({ outcome });
  }
};

export const createRepairOutcome = async ({ actor, crew, dr = 12 }) =>
  asyncPipe(
    testOutcome({
      type: "crew-action",
      formula: crew ? "d20 + @abilities.skill.value + @crew.abilities.presence.value" : "d20 + @abilities.skill.value",
      formulaLabel: crew ? "d20 + Crew Skill + PC Presence" : "d20 + Crew Skill",
      data: { ...actor.getRollData(), crew: crew?.getRollData() },
      dr
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
    }),
    withTarget({ actor }),
    withButton(getButton),
    withAnimation({ type: ANIMATION_TYPE.SIMPLE }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.REPAIR }),
  )();
