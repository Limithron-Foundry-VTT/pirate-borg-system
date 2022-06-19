import { getInitiatorToken } from "../../automation/targeting.js";

/**
 * @param {PBActor} actor
 * @param {Number} angle
 */
export const shipRotateAction = async (actor, angle) => { 
  const token = getInitiatorToken(actor);
  if (token?.document) {
    const currentRotation = token.data.rotation;
    await token.document.update({ rotation: currentRotation + angle });
  }
};
