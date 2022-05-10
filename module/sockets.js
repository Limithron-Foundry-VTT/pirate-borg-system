export const registerSocketHandler = () => {
  socket.on("system.pirateborg", (action) => {
    if (action === "scroll-chat-to-bottom") {
      ui.chat.scrollBottom();
    }
  });
};

export const scrollChatToBottom = () => {
  socket.emit("system.pirateborg", "scroll-chat-to-bottom");
};
