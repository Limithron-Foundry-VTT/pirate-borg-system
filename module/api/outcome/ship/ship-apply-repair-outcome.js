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
export const createShipApplyRepairOutcome = async ({ actor, formula = "" }) =>
  asyncPipe(
    rollOutcome({ type: "heal", formula }),
    withAsyncProps({
      heal: (outcome) => {
        const max = Math.round(actor.hp.max / 2);
        if (actor.hp.value >= max) {
          return 0;
        }
        if (actor.hp.value + outcome.roll.total >= max) {
          return max - actor.hp.value;
        }
        return outcome.roll.total;
      },
      title: (outcome) => `${game.i18n.localize("PB.Heal")} ${outcome.heal} ${game.i18n.localize("PB.HP")}`,
    }),
    withTarget({ actor }),
    withAutomations(DAMAGE_TYPE.HEAL, ANIMATION_TYPE.HEAL, ADVANCED_ANIMATION_TYPE.HEAL),
  )();
