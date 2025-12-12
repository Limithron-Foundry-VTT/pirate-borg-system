import { asyncPipe } from "../../utils.js";
import { rollOutcome } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @param {String} ability
 * @return {Promise<Object>}
 */
export const createTestAbilityOutcome = async ({ actor, ability }) =>
  asyncPipe(
    rollOutcome({
      type: "armor",
      formula: `1d20+@abilities.${ability}.value`,
      formulaLabel: `1d20 + ${game.i18n.localize(CONFIG.PB.abilityKey[ability])}`,
      data: actor.getData(),
    }),
  )();
