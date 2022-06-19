import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { createTestRelicButton } from "../../automation/buttons.js";
import { withAdvancedAnimation, withButton, withTarget } from "../automation-outcome.js";
import { outcome } from "../outcome.js";

export const createInvokeRelicOutcome = async ({ actor }) =>
  asyncPipe(
    outcome({ type: "invoke-relic" }),
    withTarget({ actor }),
    withButton((outcome) => createTestRelicButton({ outcome })),
    withAdvancedAnimation({type: ADVANCED_ANIMATION_TYPE.INVOKE_RELIC})
  )();
