import { handleActionButton } from "../api/automation/buttons.js";
import { waitForMessageRoll } from "../api/dice.js";
import { OutcomeAutomation } from "../api/automation/outcome-automation.js";

/**
 * @param {ChatMessage} message
 * @param {jQuery} html
 */
export const handleChatMessageButton = async (message, html) => {
  html.on("click", "button.item-button", async (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    await handleActionButton(message, button);
  });
};

/**
 * @param {ChatMessage} message
 * @param {jQuery} html
 */
export const handleChatMessageGMOnly = async (message, html) => {
  html.find(".gm-only").removeClass("gm-only");
};

/**
 * @param {ChatMessage} message
 * @param {jQuery} html
 */
export const handleChatMessageAutomation = async (message) => {
  if (!game.user.isGM) {
    return;
  }

  if (message.roll) {
    await waitForMessageRoll(message.id);
  }

  await OutcomeAutomation.handleChatMessage(message);
};
