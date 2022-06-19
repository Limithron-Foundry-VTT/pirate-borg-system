import { asyncPipe } from "../../utils.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

export const createExtraResourcePerDayOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({
      type: "extra-resource-per-day",
      formula: actor.extraResourceFormula,
      formulaLabel: actor.extraResourceTestFormulaLabel,
      data: actor.getRollData(),
    }),
    withAsyncProps({
      title: (outcome) => `${outcome.roll.total} ${actor.extraResourceNamePlural}`
    })
  )();
