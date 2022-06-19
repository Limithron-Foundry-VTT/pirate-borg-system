import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { DAMAGE_TYPE } from "../../automation/outcome-damage.js";
import { withAdvancedAnimation, withAnimation, withDamage, withTarget } from "../automation-outcome.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

export const createStarvationOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({
      type: "starvation",
      formula: "d4",
    }),
    withAsyncProps({
      totalDamage: (outcome) => outcome.roll.total,
      title: (outcome) => `${game.i18n.localize("PB.Take")} ${outcome.totalDamage} ${game.i18n.localize("PB.Damage")} (${game.i18n.localize("PB.Starvation")})`,
    }),
    withTarget({ actor }),
    withDamage({ type: DAMAGE_TYPE.TAKE }),
    withAnimation({ type: ANIMATION_TYPE.STARVATION }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.STARVATION }),
  )();
