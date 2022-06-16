import { showDiceWithSound } from "../../../dice.js";
import { createArmorOutcome } from "../../outcome/actor/armor-outcome.js";
import { createTakeDamageOutcome } from "../../outcome/actor/take-damage-outcome.js";

/**
 * @param {Object} originalOutcome
 * @returns {Promise.<Array.<Object>>}
 */
export const chatTakeDamageButtonAction = async (originalOutcome) => {
  const armorOutcome = await createArmorOutcome({ formula: originalOutcome.armorFormula });
  const initiatorToken = canvas.tokens.get(originalOutcome.initiatorToken);
  const targetToken = canvas.tokens.get(originalOutcome.targetToken);

  const outcome = await createTakeDamageOutcome({
    actor: initiatorToken?.actor,
    formula: originalOutcome.damageFormula,
    damageReduction: armorOutcome.total,
    targetToken,
  });

  await showDiceWithSound([outcome.roll, armorOutcome.roll]);

  return [outcome, armorOutcome];
};
