import { asyncPipe } from "../../utils.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { outcome, withAutomations, withTarget } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createReloadingOutcome = async ({ actor }) =>
  asyncPipe(outcome({ type: "reloading" }), withTarget({ actor }), withAutomations(ANIMATION_TYPE.RELOADING))();
