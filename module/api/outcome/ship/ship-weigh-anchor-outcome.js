import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { outcome, withAutomations, withTarget } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createWeighAnchorOutcome = async ({ actor }) =>
  asyncPipe(outcome({ type: "crew-action" }), withTarget({ actor }), withAutomations(ADVANCED_ANIMATION_TYPE.WEIGH_ANCHOR))();
