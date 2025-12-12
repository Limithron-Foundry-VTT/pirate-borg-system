import { asyncPipe } from "../../utils.js";
import { rollOutcome } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createInitiativeOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({
      type: "initiative",
      title: game.i18n.localize("PB.Initiative"),
      formula: "d6 + @abilities.agility.value",
      formulaLabel: game.i18n.localize("PB.InitiativeFormula"),
      data: actor.getRollData(),
    }),
  )();
