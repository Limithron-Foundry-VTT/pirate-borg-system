import { diceSound } from "../dice.js";

const GENERIC_WIELD_CARD_TEMPLATE = "systems/pirateborg/templates/chat/generic-wield-card.html";

/**
 * @param {Object} obj
 * @param {PBActor} obj.actor
 * @param {PBActor} obj.target  
 * @param {String} obj.title
 * @param {String} obj.description
 * @param {Roll} obj.wieldRoll
 * @param {String} obj.wieldDR
 * @param {String} obj.wieldFormula
 * @param {String} obj.wieldOutcomeDescription
 * @param {String} obj.wieldOutcome
 * @param {Roll} obj.secondaryWieldRoll
 * @param {String} obj.secondaryWieldDR
 * @param {String} obj.secondaryWieldFormula
 * @param {String} obj.secondaryWieldOutcomeDescription
 * @param {String} obj.secondaryWieldOutcome
 * @param {String} obj.testOutcome
 * @param {Array} obj.buttons
 * @returns {Promise.<Document>}
 */
export const showGenericWieldCard = async ({
  actor,
  target,
  title,
  description,
  wieldRoll,
  wieldDR,
  wieldFormula,
  wieldOutcome,
  wieldOutcomeDescription,
  secondaryWieldRoll,
  secondaryWieldDR,
  secondaryWieldFormula,
  secondaryWieldOutcome,
  secondaryWieldOutcomeDescription,
  damageOutcome,
  damageRoll,
  armorRoll,
  testOutcome,
  buttons = [],
  items = [],
} = {}) => {
  const rolls = [wieldRoll, secondaryWieldRoll, damageRoll, armorRoll].filter((roll) => roll);
  return await ChatMessage.create({
    content: await renderTemplate(GENERIC_WIELD_CARD_TEMPLATE, {
      title,
      target,
      description,
      wieldRoll,
      wieldDR,
      wieldFormula,
      wieldOutcome,
      wieldOutcomeDescription,
      secondaryWieldRoll,
      secondaryWieldDR,
      secondaryWieldFormula,
      secondaryWieldOutcome,
      secondaryWieldOutcomeDescription,
      damageOutcome,
      damageRoll,
      armorRoll,
      buttons: buttons,
      items: items,
    }),
    speaker: ChatMessage.getSpeaker({ actor }),
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    roll: Roll.fromTerms([PoolTerm.fromRolls(rolls)]),
    testOutcome,
    sound: diceSound(),
  });
};
