import { waitForMessageRoll } from "../api/dice.js";
import { OutcomeAutomation } from "../api/automation/outcome-automation.js";
import { OutcomeChatButton } from "../api/automation/outcome-chat-button.js";
import { emitScrollChatToBottom } from "./sockets.js";

/**
 * @param {ChatMessage} message
 * @param {jQuery} html
 */
export const handleChatMessageButton = async (message, html) => {
  html.on("click", "button.item-button", async (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    await OutcomeChatButton.handleChatMessage(message, button);

    const lastMessage = Array.from(ui.chat.collection).pop();
    if (lastMessage && lastMessage.id === message.id) {
      emitScrollChatToBottom();
      ui.chat.scrollBottom();
    }
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
