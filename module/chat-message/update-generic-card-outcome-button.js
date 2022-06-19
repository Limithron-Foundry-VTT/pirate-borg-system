import { diceSound } from "../api/dice.js";
import { getSystemFlag, setSystemFlag } from "../api/utils.js";

const GENERIC_BUTTON_OUTCOME = "systems/pirateborg/templates/chat/generic-button-outcome.html";

/**
 * @param {Object} options
 * @param {ChatMessage} options.message
 * @param {Object} options.outcome
 * @param {Array.<Object>} options.outcomes
 */
export const updateGenericCardOutcomeButton = async ({ message, outcome, outcomes } = {}) => {
  const messageContent = $(message.data.content);
  messageContent.find(`[data-outcome='${outcome.id}']`).remove();

  const content = await renderTemplate(GENERIC_BUTTON_OUTCOME, {
    outcomes,
  });

  await message.update({
    content: messageContent.append($(content)).prop("outerHTML"),
    sound: diceSound(),
  });

  const messageOutcomes = getSystemFlag(message, CONFIG.PB.flags.OUTCOMES);
  await setSystemFlag(message, CONFIG.PB.flags.OUTCOMES, [...messageOutcomes, ...outcomes]);
};
