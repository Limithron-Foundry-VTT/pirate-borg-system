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

  return ChatMessage.create({
    content: await renderTemplate(GENERIC_CARD_TEMPLATE, {
      title,
      description,
      target: target?.actor.name,
      outcomes,
      buttons,
      items,
    }),
    speaker: ChatMessage.getSpeaker({ actor }),
    sound: diceSound(),
    flags: {
      [CONFIG.PB.flagScope]: {
        [CONFIG.PB.flags.OUTCOMES]: outcomes,
      },
    },
  });
};
