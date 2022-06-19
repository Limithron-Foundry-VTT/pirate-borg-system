import { asyncPipe } from "../../../utils.js";
import { rollOutcome, withAsyncProps } from "../../outcome.js";

export const createRollSilverOutcome = async () =>
  asyncPipe(
    rollOutcome({ formula: "3d10" }),
    withAsyncProps({
      silver: (outcome) => outcome.roll.total,
      description: (outcome) => game.i18n.format("PB.GetBetterLootSilver", { silver: outcome.silver })
    })
  )();
