import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { DAMAGE_TYPE } from "../../automation/outcome-damage.js";
import { withAdvancedAnimation, withDamage, withTarget } from "../automation-outcome.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

export const createHealOutcome = async ({ actor, formula = "" }) =>
  asyncPipe(
    rollOutcome({ type: "heal", formula}),
    withAsyncProps({
      title: (outcome) => `${game.i18n.localize("PB.Heal")} ${outcome.roll.total} ${game.i18n.localize("PB.HP")}`,
      heal: (outcome) => outcome.roll.total,
    }),
    withTarget({ actor }),
    withDamage({ type: DAMAGE_TYPE.HEAL }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.HEAL }),
  )();
