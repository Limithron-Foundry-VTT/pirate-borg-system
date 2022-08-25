import { showDiceWithSound } from "../../dice.js";
import { createTestRelicOutcome } from "../../outcome/character/test-relic-outcome.js";

/**
 * @param {Object} originalOutcome
 * @returns {Promise.<Array.<Object>>}
 */
export const chatTestRelicButtonAction = async (originalOutcome) => {
  const initiatorToken = canvas.ready ? canvas.tokens?.get(originalOutcome.initiatorToken) : null;
  const initiatorActor = initiatorToken?.actor ?? game.actors.get(originalOutcome.initiatorActor);

  const outcome = await createTestRelicOutcome({
    actor: initiatorActor,
    data: initiatorActor.getRollData() ?? {},
  });

  await showDiceWithSound([outcome.roll]);

  return [outcome];
};
