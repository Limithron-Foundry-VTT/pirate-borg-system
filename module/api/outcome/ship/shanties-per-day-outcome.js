import { asyncPipe } from "../../../utils.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

export const createShantiesPerDayOutcome = async ({ actor}) =>
  asyncPipe(
    rollOutcome({
      type: "shanties-per-day",
      formula: "d4+@abilities.spirit.value",
      formulaLabel: game.i18n.localize("PB.ShipShantiesPerDayFormula"),
      data: actor.getRollData(),
    }),
    withAsyncProps({
      title: (outcome) => `${outcome.roll.total} ${game.i18n.localize("PB.ShipMysticShanties")}`
    }),
  )();
