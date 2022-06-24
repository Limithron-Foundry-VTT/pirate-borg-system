import { asyncPipe } from "../../utils.js";
import { rollOutcome } from "../outcome.js";

/**
 * @param {String} formula
 * @return {Promise<Object>}
 */
export const createArmorOutcome = async ({ formula }) =>
  asyncPipe(
    rollOutcome({
      type: "armor",
      formula,
      formulaLabel: `${game.i18n.localize("PB.Armor")}: ${formula}`,
    })
  )();
