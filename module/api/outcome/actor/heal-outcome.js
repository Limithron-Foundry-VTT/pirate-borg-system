import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { rollOutcome, withAsyncProps, withAutomations, withTarget } from "../outcome.js";
import { DAMAGE_TYPE } from "../../automation/outcome-damage.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";

/**
 * @param {PBActor} actor
 * @param {String} formula
 * @return {Promise<Object>}
 */
export const createHealOutcome = async ({ actor, formula = "" }) =>
  asyncPipe(
    rollOutcome({ type: "heal", formula }),
    withAsyncProps({
      title: (outcome) => `${game.i18n.localize("PB.Heal")} ${outcome.roll.total} ${game.i18n.localize("PB.HP")}`,
      heal: (outcome) => outcome.roll.total,
    }),
    withTarget({ actor }),
    withAutomations(DAMAGE_TYPE.HEAL, ANIMATION_TYPE.HEAL, ADVANCED_ANIMATION_TYPE.HEAL),
  )();
