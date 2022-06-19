import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { DAMAGE_TYPE } from "../../automation/outcome-damage.js";
import { withAdvancedAnimation, withDamage, withTarget } from "../automation-outcome.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

export const createTakeDamageOutcome = async ({ actor, formula = "", damageReduction = 0, targetToken }) =>
  asyncPipe(
    rollOutcome({
      type: "take-damage",
      formula,
      formulaLabel: `${game.i18n.localize("PB.TargetArmor")}: ${formula}`,
    }),
    withAsyncProps({
      totalDamage: (outcome) => Math.round(Math.max(0, outcome.roll.total - damageReduction)),
      title: (outcome) => `${game.i18n.localize("PB.Take")} ${outcome.totalDamage} ${game.i18n.localize("PB.Damage")}`,
    }),
    withTarget({ actor, targetToken }),
    withDamage({ type: DAMAGE_TYPE.TAKE }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.TAKE_DAMAGE }),
  )();
