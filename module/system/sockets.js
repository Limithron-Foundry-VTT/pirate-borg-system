const ACTION = {
  SCROLL_CHAT_TO_BOTTOM: "scroll-chat-to-bottom",
  DAMAGE_ON_TOKEN: "damage-on-token",
};

export const registerSocketHandler = () => {
  socket.on("system.pirateborg", ({ action } = {}) => {
    switch (action) {
      case ACTION.SCROLL_CHAT_TO_BOTTOM:
        scrollChatToBottom();
        break;
    }
  });
};

const scrollChatToBottom = () => ui.chat.scrollBottom();

export const emitScrollChatToBottom = () => socket.emit("system.pirateborg", { action: ACTION.SCROLL_CHAT_TO_BOTTOM });
