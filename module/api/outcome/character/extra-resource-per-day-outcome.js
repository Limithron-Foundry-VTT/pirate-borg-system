import { asyncPipe } from "../../utils.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createExtraResourcePerDayOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({
      type: "extra-resource-per-day",
      formula: `max(${actor.extraResourceFormula}, 0)`,
      formulaLabel: actor.extraResourceFormulaLabel,
      data: actor.getRollData(),
    }),
    withAsyncProps({
      title: (outcome) => `${outcome.roll.total} ${actor.extraResourceNamePlural}`,
    })
  )();
