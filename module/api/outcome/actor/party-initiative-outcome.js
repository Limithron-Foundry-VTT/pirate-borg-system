import { asyncPipe } from "../../utils.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

/**
 * @return {Promise<Object>}
 */
export const createPartyInitiativeOutcome = async () =>
  asyncPipe(
    rollOutcome({
      type: "initiative",
      formula: "d6",
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(outcome.roll.total <= 3 ? "PB.InitiativeEnemiesBegin" : "PB.InitiativePlayerCharactersBegin"),
    }),
  )();
