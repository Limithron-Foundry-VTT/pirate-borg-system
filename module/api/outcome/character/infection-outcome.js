import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { rollOutcome, withAsyncProps, withAutomations, withTarget } from "../outcome.js";
import { DAMAGE_TYPE } from "../../automation/outcome-damage.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createInfectionOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({ type: "infection", formula: "d6" }),
    withAsyncProps({
      totalDamage: (outcome) => outcome.roll.total,
      title: (outcome) => `${game.i18n.localize("PB.Take")} ${outcome.totalDamage} ${game.i18n.localize("PB.Damage")} (${game.i18n.localize("PB.Infection")})`,
    }),
    withTarget({ actor }),
    withAutomations(DAMAGE_TYPE.TAKE, ANIMATION_TYPE.TAKE_DAMAGE, ANIMATION_TYPE.INFECTED, ADVANCED_ANIMATION_TYPE.INFECTED),
  )();
