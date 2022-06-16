import { asyncPipe } from "../../../utils.js";
import { withAdvancedAnimation, withDamage, withTarget } from "../automation-outcome.js";
import { outcome, withAsyncProps, withRoll } from "../outcome.js";

export const createHealOutcome = async ({ actor, formula = "" }) =>
  asyncPipe(
    outcome({ type: "heal" }),
    withRoll({ formula }),
    withAsyncProps({
      title: (outcome) => `${game.i18n.localize("PB.Heal")} ${outcome.roll.total} ${game.i18n.localize("PB.HP")}`,
      heal: (outcome) => outcome.roll.total,
    }),
    withTarget({ actor }),
    withDamage({ type: DAMAGE_TYPE.HEAL }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.HEAL }),
  )();
