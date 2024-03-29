import { showDiceWithSound } from "../../dice.js";
import { createShipApplyRepairOutcome } from "../../outcome/ship/ship-apply-repair-outcome.js";

/**
 * @param {Object} originalOutcome
 * @returns {Promise.<Array.<Object>>}
 */
export const chatShipRepairButtonAction = async (originalOutcome) => {
  const initiatorToken = canvas.ready ? canvas.tokens?.get(originalOutcome.initiatorToken) : null;
  const initiatorActor = initiatorToken?.actor ?? game.actors.get(originalOutcome.initiatorActor);

  const outcome = await createShipApplyRepairOutcome({
    actor: initiatorActor,
    formula: "d6",
  });

  await showDiceWithSound([outcome.roll]);

  return [outcome];
};
