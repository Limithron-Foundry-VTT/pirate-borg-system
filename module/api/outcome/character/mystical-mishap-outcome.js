import { drawMysticalMishaps } from "../../../compendium.js";
import { asyncPipe } from "../../../utils.js";
import { withAdvancedAnimation, withTarget } from "../automation-outcome.js";
import { outcome, withDraw } from "../outcome.js";

export const createMysticalMishapOutcome = async ({ actor, roll }) =>
  asyncPipe(
    outcome({
      type: "mystical-mishap",
      title: game.i18n.localize("PB.MysticalMishaps"),
    }),
    withDraw({
      rollTableDraw: await drawMysticalMishaps({
        roll,
      }),
    }),
    withTarget({ actor }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.MYSTICAL_MISHAP }),
  )();
