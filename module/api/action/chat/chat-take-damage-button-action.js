import { showDiceWithSound } from "../../dice.js";
import { createArmorOutcome } from "../../outcome/actor/armor-outcome.js";
import { createTakeDamageOutcome } from "../../outcome/actor/take-damage-outcome.js";

/**
 * @param {Object} originalOutcome
 * @returns {Promise.<Array.<Object>>}
 */
export const chatTakeDamageButtonAction = async (originalOutcome) => {
  const armorOutcome = await createArmorOutcome({ formula: originalOutcome.armorFormula });
  const initiatorToken = canvas.ready ? canvas.tokens?.get(originalOutcome.initiatorToken) : null;
  const initiatorActor = initiatorToken?.actor ?? game.actors.get(originalOutcome.initiatorActor);

  const targetToken = canvas.ready ? canvas.tokens.get(originalOutcome.targetToken) : null;

  const outcome = await createTakeDamageOutcome({
    actor: initiatorActor,
    formula: originalOutcome.damageFormula,
    damageReduction: armorOutcome.total,
    targetToken,
  });

  await showDiceWithSound([outcome.roll, armorOutcome.roll]);

  return [outcome, armorOutcome];
};
