import { asyncPipe } from "../../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { withAdvancedAnimation, withTarget } from "../automation-outcome.js";
import { outcome } from "../outcome.js"

export const createWeighAnchorOutcome = async ({ actor }) =>
  asyncPipe(
    outcome({ type: "crew-action" }),
    withTarget({ actor }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.WEIGH_ANCHOR }),
  )();
