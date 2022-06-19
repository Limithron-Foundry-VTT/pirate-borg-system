import { drawReaction } from "../../compendium.js";
import { asyncPipe } from "../../utils.js";
import { drawOutcome, withAsyncProps } from "../outcome.js";

export const createReactionOutcome = async () =>
  asyncPipe(
    drawOutcome({draw: await drawReaction()}),
    withAsyncProps({
      title: (outcome) => outcome.description,
      description: () => "",
    })
  )();
