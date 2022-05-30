const ACTION = {
  SCROLL_CHAT_TO_BOTTOM: "scroll-chat-to-bottom",
  DAMAGE_ON_TOKEN: "damage-on-token" ,
};

export const registerSocketHandler = () => {
  socket.on("system.pirateborg", ({action, payload = {}} = {}) => {
    switch(action) {
      case ACTION.SCROLL_CHAT_TO_BOTTOM:
        scrollChatToBottom();
        break;
      case ACTION.DAMAGE_ON_TOKEN:
        damageOnToken(...payload);
        break;        
    }
  });
};

const scrollChatToBottom = () => ui.chat.scrollBottom();

export const emitScrollChatToBottom = () => socket.emit("system.pirateborg", {action: ACTION.SCROLL_CHAT_TO_BOTTOM});

/**
 * @param {String} tokenId 
 * @param {String} sourceActorId  
 * @param {Number} damage 
 */
const damageOnToken = (tokenId, sourceActorId, damage) => {
  if (!game.user.isGM) { return }  
  const actor = canvas.tokens.get(tokenId).actor;
  if (actor) {
    actor.takeActorDamage(game.actors.get(sourceActorId), damage);
  }
}

/**
 * @param {String} actorId 
 * @param {String} sourceActorId  
 * @param {Number} damage 
 */
export const emitDamageOnToken = (tokenId, sourceActorId, damage) => socket.emit("system.pirateborg", { action: ACTION.DAMAGE_ON_TOKEN, payload: [tokenId, sourceActorId, damage]});