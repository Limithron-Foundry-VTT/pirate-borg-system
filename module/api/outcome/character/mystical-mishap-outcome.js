import { drawMysticalMishaps } from "../../compendium.js";
import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { withAdvancedAnimation, withTarget } from "../automation-outcome.js";
import { drawOutcome } from "../outcome.js";

export const createMysticalMishapOutcome = async ({ actor, roll }) =>
  asyncPipe(
    drawOutcome({
      type: "mystical-mishap",
      title: game.i18n.localize("PB.MysticalMishaps"),      
      draw: await drawMysticalMishaps({
        roll,
      }),      
    }),
    withTarget({ actor }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.MYSTICAL_MISHAP }),
  )();
