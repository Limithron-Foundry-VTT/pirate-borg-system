import { showDiceWithSound } from "../../dice.js";
import { evaluateFormula } from "../../utils.js";
import { createMysticalMishapOutcome } from "../../outcome/character/mystical-mishap-outcome.js";

/**
 * @param {Object} originalOutcome
 * @returns {Promise.<Array.<Object>>}
 */
export const chatMysticalMyshapButtonAction = async (originalOutcome) => {
  const initiatorToken = canvas.ready ? canvas.tokens?.get(originalOutcome.initiatorToken) : null;
  const initiatorActor = initiatorToken?.actor ?? game.actors.get(originalOutcome.initiatorActor);

  const outcome = await createMysticalMishapOutcome({
    actor: initiatorActor,
    isFumble: originalOutcome.isFumble,
    roll: await evaluateFormula(originalOutcome.isFumble ? "2d20kl" : "1d20"),
  });

  await showDiceWithSound([outcome.roll]);

  return [outcome];
};
