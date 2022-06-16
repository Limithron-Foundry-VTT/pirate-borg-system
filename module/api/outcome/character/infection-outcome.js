import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { DAMAGE_TYPE } from "../../automation/outcome-damage.js";
import { withAdvancedAnimation, withAnimation, withDamage, withTarget } from "../automation-outcome.js";
import { outcome, withAsyncProps, withRoll } from "../outcome.js";

export const createInfectionOutcome = async ({ actor }) =>
  asyncPipe(
    outcome({ type: "infection" }),
    withRoll({ formula: "d6" }),
    withAsyncProps({
      totalDamage: (outcome) => outcome.roll.total,
      title: (outcome) => `${game.i18n.localize("PB.Take")} ${outcome.totalDamage} ${game.i18n.localize("PB.Damage")} (${game.i18n.localize("PB.Infection")})`,
    }),
    withTarget({ actor }),
    withDamage({ type: DAMAGE_TYPE.TAKE }),
    withAnimation({ type: ANIMATION_TYPE.INFECTED }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.INFECTED }),
  )();
