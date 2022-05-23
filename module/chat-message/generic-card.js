const GENERIC_CHAT_MESSAGE_TEMPLATE = "systems/pirateborg/templates/chat/generic-chat-message-card.html";

/**
 * @param {Object} obj
 * @param {Actor} obj.actor
 * @param {String} obj.title
 * @param {String} obj.description
 * @returns {Promise.<Document>}
 */
export const showGenericCard = async ({ actor, title, description, buttons = [] } = {}) => {
  return await ChatMessage.create({
    content: await renderTemplate(GENERIC_CHAT_MESSAGE_TEMPLATE, {
      title: title,
      description: description,
      buttons: buttons,
    }),
    speaker: ChatMessage.getSpeaker({ actor }),
  });
};
