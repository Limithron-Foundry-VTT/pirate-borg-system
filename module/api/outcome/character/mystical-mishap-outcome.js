import { drawMysticalMishaps } from "../../compendium.js";
import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { drawOutcome, withAutomations, withTarget } from "../outcome.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";

/**
 * @param {PBActor} actor
 * @param {Roll} roll
 * @param {Boolean} isFumble
 * @return {Promise<Object>}
 */
export const createMysticalMishapOutcome = async ({ actor, roll, isFumble = false }) =>
  asyncPipe(
    drawOutcome({
      type: "mystical-mishap",
      title: game.i18n.localize("PB.MysticalMishaps"),
      draw: await drawMysticalMishaps({ roll }),
      isFumble,
    }),
    withTarget({ actor }),
    withAutomations(ANIMATION_TYPE.MYSTICAL_MISHAP, ADVANCED_ANIMATION_TYPE.MYSTICAL_MISHAP),
  )();
