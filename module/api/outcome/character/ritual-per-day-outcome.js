import { asyncPipe } from "../../utils.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createRitualPerDayOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({
      type: "rituals-per-day",
      formula: "max(d4 + @abilities.spirit.value, 0)",
      data: actor.getRollData(),
    }),
    withAsyncProps({
      title: (outcome) => `${outcome.roll.total} ${game.i18n.localize("PB.Rituals")}`,
      formulaLabel: () =>
        game.i18n.format("PB.RitualPerDayFormula", {
          score: actor.abilities.spirit.value,
        }),
    })
  )();
