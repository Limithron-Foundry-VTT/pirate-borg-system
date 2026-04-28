/**
 * Normalize the chat "other" style/type constant across generations.
 * @returns {number}
 */
export const getOtherChatMessageStyle = () => CONST.CHAT_MESSAGE_STYLES?.OTHER ?? CONST.CHAT_MESSAGE_TYPES?.OTHER ?? 0;

/**
 * Create a chat message after applying the current core roll mode.
 * @param {object} messageData
 * @param {object} [options]
 * @param {string} [options.rollMode]
 * @param {boolean} [options.applyRollMode=true]
 * @returns {Promise<ChatMessage>}
 */
export const createChatMessageWithVisibility = async (messageData, { rollMode = game.settings.get("core", "rollMode"), applyRollMode = true } = {}) => {
  const payload = { ...messageData };
  if (applyRollMode) {
    if (typeof ChatMessage.applyMode === "function") {
      ChatMessage.applyMode(payload, rollMode);
    } else {
      ChatMessage.applyRollMode(payload, rollMode);
    }
  }
  return ChatMessage.create(payload);
};
