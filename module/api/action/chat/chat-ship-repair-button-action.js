import { showDiceWithSound } from "../../dice.js";
import { createHealOutcome } from "../../outcome/actor/heal-outcome.js";

/**
 * @param {Object} originalOutcome
 * @returns {Promise.<Array.<Object>>}
 */
export const chatShipRepairButtonAction = async (originalOutcome) => {
  const initiatorToken = canvas.tokens.get(originalOutcome.initiatorToken);

  const outcome = await createHealOutcome({
    actor: initiatorToken?.actor,
    formula: "d6",
  });

  await showDiceWithSound([outcome.roll]);

  return [outcome];
};
