import { showDiceWithSound } from "../../../dice.js";
import { createTestRelicOutcome } from "../../outcome/character/test-relic-outcome.js";

/**
 * @param {Object} originalOutcome
 * @returns {Promise.<Array.<Object>>}
 */
export const chatInvokeRelicButtonAction = async (originalOutcome) => {
  const initiatorToken = canvas.tokens.get(originalOutcome.initiatorToken);

  const outcome = await createTestRelicOutcome({
    actor: initiatorToken?.actor,
    data: canvas.tokens.get(originalOutcome.initiatorToken)?.actor?.getRollData() ?? {},
  });

  await showDiceWithSound([outcome.roll]);

  return [outcome];
};
