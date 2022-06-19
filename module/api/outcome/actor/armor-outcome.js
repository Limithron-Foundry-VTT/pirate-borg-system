import { asyncPipe } from "../../utils.js";
import { rollOutcome } from "../outcome.js";

export const createArmorOutcome = async ({ formula }) =>
  asyncPipe(
    rollOutcome({
      type: "armor",
      formula, 
      formulaLabel: `${game.i18n.localize("PB.Armor")}: ${formula}`
    }),
  )();
