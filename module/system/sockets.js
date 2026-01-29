import { handleStairwaySocketEvent } from "../stairway/main.js";

const ACTION = {
  SCROLL_CHAT_TO_BOTTOM: "scroll-chat-to-bottom",
  DAMAGE_ON_TOKEN: "damage-on-token",
};

// Stairway-related actions
const STAIRWAY_ACTIONS = [
  "stairway",
  "stairway-create",
  "stairway-update",
  "stairway-delete",
  "stairway-teleport-request",
  "stairway-token-select",
];

export const registerSocketHandler = () => {
  game.socket.on("system.pirateborg", (message = {}) => {
    const { action } = message;

    // Handle stairway-related actions
    if (action && (STAIRWAY_ACTIONS.includes(action) || action.startsWith("stairway"))) {
      handleStairwaySocketEvent(message);
      return;
    }

    // Handle other actions
    switch (action) {
      case ACTION.SCROLL_CHAT_TO_BOTTOM:
        scrollChatToBottom();
        break;
    }
  });
};

const scrollChatToBottom = () => ui.chat.scrollBottom();

export const emitScrollChatToBottom = () => game.socket.emit("system.pirateborg", { action: ACTION.SCROLL_CHAT_TO_BOTTOM });
