/**
 * Normalize the chat "other" style/type constant across generations.
 * @returns {number}
 */
export const getOtherChatMessageStyle = () => CONST.CHAT_MESSAGE_STYLES?.OTHER ?? CONST.CHAT_MESSAGE_TYPES?.OTHER ?? 0;

// v12/v13 compat — drop when minimum is v14: collapse getDefaultMessageMode to game.settings.get("core","messageMode"), remove MODE_TO_LEGACY and the applyRollMode branch below.
const LEGACY_TO_MODE = { publicroll: "public", gmroll: "gm", blindroll: "blind", selfroll: "self" };
const MODE_TO_LEGACY = { public: "publicroll", gm: "gmroll", blind: "blindroll", self: "selfroll" };

const getDefaultMessageMode = () => {
  if ((game.release?.generation ?? 0) >= 14) return game.settings.get("core", "messageMode");
  const legacy = game.settings.get("core", "rollMode");
  return LEGACY_TO_MODE[legacy] ?? legacy;
};

/**
 * Create a chat message after applying the current message visibility mode.
 * @param {object} messageData
 * @param {object} [options]
 * @param {string} [options.rollMode]
 * @param {boolean} [options.applyRollMode=true]
 * @returns {Promise<ChatMessage>}
 */
export const createChatMessageWithVisibility = async (messageData, { rollMode, applyRollMode = true } = {}) => {
  const payload = { ...messageData };
  if (applyRollMode) {
    const mode = rollMode ? LEGACY_TO_MODE[rollMode] ?? rollMode : getDefaultMessageMode();
    if (typeof ChatMessage.applyMode === "function") {
      ChatMessage.applyMode(payload, mode);
    } else {
      ChatMessage.applyRollMode(payload, MODE_TO_LEGACY[mode] ?? mode);
    }
  }
  return ChatMessage.create(payload);
};
