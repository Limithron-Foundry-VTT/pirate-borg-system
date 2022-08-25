import { getInitiatorToken } from "../../targeting.js";
import { getTokenRotation } from "../../utils.js";

/**
 * @param {PBActor} actor
 * @param {Number} angle
 */
export const shipRotateAction = async (actor, angle) => {
  const token = getInitiatorToken(actor);
  if (token?.document) {
    const currentRotation = getTokenRotation(token);
    await token.document.update({ rotation: currentRotation + angle });
  }
};
