import { diceSound } from "../dice.js";

const GENERIC_CARD_TEMPLATE = "systems/pirateborg/templates/chat/generic-card.html";

/**
 * @param {Object} options
 * @param {PBActor} options.actor
 * @param {Token} options.target
 * @param {String} options.title
 * @param {String} options.description
 * @param {Outcome} obj.outcomes
 * @param {Array.<Object>} options.buttons
 * @param {Array.<PBItem>} options.items
 * @returns {Promise.<ChatMessage>}
 */
export const showGenericCard = async ({ actor, target, title, description, outcomes = [], buttons = [], items = [] } = {}) => {
  const rolls = outcomes.map((outcome) => outcome.roll).filter((roll) => roll);
  return await ChatMessage.create({
    content: await renderTemplate(GENERIC_CARD_TEMPLATE, {
      title,
      description,
      target: target?.actor.name,
      outcomes,
      buttons,
      items,
    }),
    speaker: ChatMessage.getSpeaker({ actor }),
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    roll: Roll.fromTerms([PoolTerm.fromRolls(rolls)]),
    sound: diceSound(),
    flags: {
      [CONFIG.PB.flagScope]: {
        [CONFIG.PB.flags.OUTCOMES]: outcomes,
      },
    },
  });
};
