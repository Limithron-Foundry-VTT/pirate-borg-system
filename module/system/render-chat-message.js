import { OutcomeAutomation } from "../api/automation/outcome-automation.js";
import { OutcomeChatButton } from "../api/automation/outcome-chat-button.js";
import { emitScrollChatToBottom } from "./sockets.js";

/**
 * @param {ChatMessage} message
 * @param {JQuery.<HTMLElement>} html
 */
export const handleChatMessageButton = async (message, html) => {
  if (foundry.utils.isNewerVersion(game.version, "13")) {
    // For now, wrap the html back to a jQuery object, same as it was prior to v13.
    html = $(html);
  }
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
 * Strip the gm-only marker class from rendered content when visible to the
 * current user. Kept as a direct Foundry render hook fallback for generations
 * where custom pirateborg.renderChatMessage emission may not run.
 *
 * @param {ChatMessage} message
 * @param {JQuery.<HTMLElement>|HTMLElement} html
 */
export const handleChatMessageGMOnly = async (message, html) => {
  if (!html) return;
  if (foundry.utils.isNewerVersion(game.version, "13")) {
    html = $(html);
  }
  html.find(".gm-only").removeClass("gm-only");
};

/**
 * @param {ChatMessage} message
 */
export const handleChatMessageAutomation = async (message) => {
  if (!game.user.isGM) {
    return;
  }

  await OutcomeAutomation.handleChatMessage(message);
};
