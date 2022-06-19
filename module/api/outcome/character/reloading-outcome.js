import { asyncPipe } from "../../../utils.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { withAnimation, withTarget } from "../automation-outcome.js";
import { outcome } from "../outcome.js";

export const createReloadingOutcome = async ({ actor }) =>
  asyncPipe(
    outcome({ type: "reloading" }),
    withTarget({ actor }),
    withAnimation({ type: ANIMATION_TYPE.RELOADING })
  )();
