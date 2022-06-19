import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { DAMAGE_TYPE } from "../../automation/outcome-damage.js";
import { withAdvancedAnimation, withDamage, withTarget } from "../automation-outcome.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

export const createInflictDamageOutcome = async ({ actor, formula = "", damageReduction = 0, targetToken }) =>
  asyncPipe(
    rollOutcome({
      type: "inflict-damage",
      formula,
      formulaLabel: `${game.i18n.localize("PB.Damage")}: ${formula}`,      
    }),
    withAsyncProps({
      totalDamage: (outcome) => Math.round(Math.max(0, outcome.roll.total - damageReduction)),
      title: (outcome) => `${game.i18n.localize("PB.Inflict")} ${outcome.totalDamage} ${game.i18n.localize("PB.Damage")}`,
    }),
    withTarget({ actor, targetToken }),
    withDamage({ type: DAMAGE_TYPE.INFLICT }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.INFLICT_DAMAGE }),
  )();
