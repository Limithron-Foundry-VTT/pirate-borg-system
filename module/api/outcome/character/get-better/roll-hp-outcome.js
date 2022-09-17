import { asyncPipe } from "../../../utils.js";
import { rollOutcome, withAsyncProps } from "../../outcome.js";

/**
 * @param {String} hp
 * @return {Promise<Object>}
 */
export const createRollHPOutcome = async ({ hp }) =>
  asyncPipe(
    rollOutcome({
      type: "get-better-roll-hp",
      title: game.i18n.localize("PB.HP"),
      formula: "1d6",
    }),
    withAsyncProps({
      description: (outcome) => game.i18n.format("PB.GetBetterHP", { hp: outcome.roll.total }),
      newHp: (outcome) => outcome.roll.total + hp,
    })
  )();
