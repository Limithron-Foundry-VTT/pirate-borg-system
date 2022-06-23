import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { rollOutcome, withAsyncProps, withAutomations, withTarget } from "../outcome.js";
import {DAMAGE_TYPE} from "../../automation/outcome-damage";

/**
 * @param {PBActor} actor
 * @param {String} formula
 * @param {Number} damageReduction
 * @param {Token} targetToken
 * @return {Promise<Object>}
 */
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
    withAutomations(ADVANCED_ANIMATION_TYPE.INFLICT_DAMAGE, DAMAGE_TYPE.INFLICT)
  )();
