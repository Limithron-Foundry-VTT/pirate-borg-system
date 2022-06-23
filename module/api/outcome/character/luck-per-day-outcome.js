import { asyncPipe } from "../../utils.js";
import { rollOutcome, withAsyncProps } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createLuckPerDayOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({
      type: "luck-per-day",
      formula: actor.luckDie,
      data: actor.getRollData(),
    }),
    withAsyncProps({
      title: (outcome) => `${outcome.roll.total} ${game.i18n.localize("PB.Lucks")}`,
    }),
  )();
