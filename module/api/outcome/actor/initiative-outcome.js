import { asyncPipe } from "../../utils.js";
import { rollOutcome } from "../outcome.js";

export const createInitiativeOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({
      type: "initiative", 
      title: game.i18n.localize("PB.Initiative"),
      formula: 'd6', 
      data: actor.getRollData()
    }),
  )();
