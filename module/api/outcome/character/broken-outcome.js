import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { withAdvancedAnimation, withAnimation, withTarget } from "../automation-outcome.js";
import { outcome, withAsyncProps, withDraw } from "../outcome.js";

export const createBrokenOutcome = async ({ actor }) =>
  asyncPipe(
    outcome({ type: "broken" }),
    withDraw({ rollTableDraw: await drawBroken() }),
    withTarget({ actor }),
    withAsyncProps({
      isDead: (outcome) => outcome.roll.total === 4,
    }),
    withAnimation({ type: ANIMATION_TYPE.BROKEN }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.BROKEN }),
  )();
