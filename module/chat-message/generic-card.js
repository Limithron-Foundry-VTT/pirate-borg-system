import { diceSound, showDiceWithSound } from "../api/dice.js";

const GENERIC_CARD_TEMPLATE = "systems/pirateborg/templates/chat/generic-card.html";

/**
 * @param {PBActor} [actor]
 * @param {Token} [target]
 * @param {String} [title]
 * @param {String} [description]
 * @param {Object[]} [outcomes]
 * @param {Object[]} [buttons]
 * @param {PBItem[]} [items]
 * @return {Promise<ChatMessage>}
 */
export const showGenericCard = async ({ actor, target, title, description, outcomes = [], buttons = [], items = [] } = {}) => {
  const rolls = outcomes.map((outcome) => outcome.roll).filter((roll) => roll);

  if (rolls.length) {
    await showDiceWithSound(rolls);
  }

  const data = {
    title,
    description,
    target: target?.actor.name,
    outcomes,
    buttons,
    items,
  };
  let content;
  if (game.release.generation >= 13) {
    content = await foundry.applications.handlebars.renderTemplate(GENERIC_CARD_TEMPLATE, data);
  } else {
    content = await renderTemplate(GENERIC_CARD_TEMPLATE, data);
  }

  const messageData = {
    content: content,
    speaker: ChatMessage.getSpeaker({ actor }),
    ...(rolls.length ? { sound: diceSound() } : {}),
    flags: {
      [CONFIG.PB.flagScope]: {
        [CONFIG.PB.flags.OUTCOMES]: outcomes,
      },
    },
  };
  ChatMessage.applyRollMode(messageData, game.settings.get("core", "rollMode"));
  return ChatMessage.create(messageData);
};
