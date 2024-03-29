import { asyncPipe } from "../../utils.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createShantiesPerDayOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({
      type: "shanties-per-day",
      formula: "1+@abilities.spirit.value",
      formulaLabel: game.i18n.localize("PB.ShipShantiesPerDayFormula"),
      data: actor?.getRollData() ?? {},
    }),
    withAsyncProps({
      title: (outcome) => `${outcome.roll.total} ${game.i18n.localize("PB.ShipMysticShanties")}`,
    })
  )();
