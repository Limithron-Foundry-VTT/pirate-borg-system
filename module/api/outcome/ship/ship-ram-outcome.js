import { asyncPipe } from "../../../utils.js";
import { withAdvancedAnimation, withTarget } from "../automation-outcome.js";
import { outcome } from "../outcome.js";

export const createRamOutcome = async ({ actor, targetToken }) =>
asyncPipe(outcome({ type: "crew-attack" }), withTarget({ actor, targetToken }), withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.RAM }))();
