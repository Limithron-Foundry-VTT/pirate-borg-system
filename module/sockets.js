const SCROLL_CHAT_TO_BOTTOM_ACTION = "scroll-chat-to-bottom";

export const registerSocketHandler = () => {
  socket.on("system.pirateborg", (action) => {
    if (action === SCROLL_CHAT_TO_BOTTOM_ACTION) {
      ui.chat.scrollBottom();
    }
  });
};

export const scrollChatToBottom = () => {
  socket.emit("system.pirateborg", SCROLL_CHAT_TO_BOTTOM_ACTION);
};
