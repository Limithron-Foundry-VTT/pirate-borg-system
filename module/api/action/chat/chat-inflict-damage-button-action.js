import { showDiceWithSound } from "../../dice.js";
import { createArmorOutcome } from "../../outcome/actor/armor-outcome.js";
import { createInflictDamageOutcome } from "../../outcome/actor/inflict-damage-outcome.js";

/**
 * @param {Object} originalOutcome
 * @returns {Promise.<Array.<Object>>}
 */
export const chatInflictDamageButtonAction = async (originalOutcome) => {
  const initiatorToken = canvas.tokens.get(originalOutcome.initiatorToken);
  const targetToken = canvas.tokens.get(originalOutcome.targetToken);

  const armorOutcome = await createArmorOutcome({ formula: originalOutcome.armorFormula });

  const outcome = await createInflictDamageOutcome({
    actor: initiatorToken?.actor,
    formula: originalOutcome.damageFormula,
    damageReduction: armorOutcome.total,
    targetToken,
  });

  await showDiceWithSound([outcome.roll, armorOutcome.roll]);

  return [outcome, armorOutcome];
};
