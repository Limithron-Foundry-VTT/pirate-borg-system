import { drawBroken } from "../../compendium.js";
import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { drawOutcome, withAsyncProps, withAutomations, withTarget } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createBrokenOutcome = async ({ actor }) =>
  asyncPipe(
    drawOutcome({
      type: "broken",
      draw: await drawBroken(),
    }),
    withTarget({ actor }),
    withAsyncProps({
      isDead: (outcome) => outcome.roll.total === 1,
    }),
    withAutomations(ANIMATION_TYPE.BROKEN, ADVANCED_ANIMATION_TYPE.BROKEN),
  )();
