import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { outcome, withAutomations, withTarget } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @param {Token} targetToken
 * @return {Promise<Object>}
 */
export const createRamOutcome = async ({ actor, targetToken }) =>
  asyncPipe(outcome({ type: "crew-attack" }), withTarget({ actor, targetToken }), withAutomations(ADVANCED_ANIMATION_TYPE.RAM))();
