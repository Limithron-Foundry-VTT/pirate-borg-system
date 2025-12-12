import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { drawDerelictTakesDamage } from "../../compendium.js";
import { asyncPipe } from "../../utils.js";
import { drawOutcome, withAsyncProps, withAutomations, withTarget } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createSinkingOutcome = async ({ actor }) =>
  asyncPipe(
    drawOutcome({
      draw: await drawDerelictTakesDamage(),
    }),
    withAsyncProps({
      isNothing: (outcome) => outcome.roll.total <= 2,
      isSinking: (outcome) => [3, 4, 5].includes(outcome.roll.total),
      isExplosion: (outcome) => outcome.roll.total === 6,
      isMajorExplosion: (outcome) => outcome.roll.total === 7,
      isFatalExplosion: (outcome) => outcome.roll.total === 8,
    }),
    withTarget({ actor }),
    withAutomations(ADVANCED_ANIMATION_TYPE.SINKING),
  )();
