import { drawBroken } from "../../compendium.js";
import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { withAdvancedAnimation, withAnimation, withTarget } from "../automation-outcome.js";
import { drawOutcome, withAsyncProps } from "../outcome.js";

export const createBrokenOutcome = async ({ actor }) =>
  asyncPipe(
    drawOutcome({
      type: "broken",
      draw: await drawBroken()
    }),
    withTarget({ actor }),
    withAsyncProps({
      isDead: (outcome) => outcome.roll.total === 4,
    }),
    withAnimation({ type: ANIMATION_TYPE.BROKEN }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.BROKEN }),
  )();
