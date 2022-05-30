import { evaluateFormula } from "./utils.js";
export { showGenericCard } from "./chat-message/generic-card.js";
export { showGenericWieldCard } from "./chat-message/generic-wield-card.js";
export { drawTable } from "./compendium.js";

/**
 *
 * @param {String} formula
 * @param {Object} rollData
 * @returns
 */
export const createRoll = async (formula, rollData = {}) => {
  return await evaluateFormula(formula, rollData);
};

/**
 * @param {Document} macro
 * @param {Object} meta
 * @param {Actor} meta.actor
 * @param {Token} meta.token
 * @param {PBItem} meta.item
 */
export const executeMacro = async (macro, { actor, token, item } = {}) => {
  const speaker = ChatMessage.implementation.getSpeaker();
  const character = game.user.character;
  actor = actor || game.actors.get(speaker.actor);
  token = token || (canvas.ready ? canvas.tokens.get(speaker.token) : null);
  const body = `(async () => {
      ${macro.data.command}
    })()`;
  const fn = Function("speaker", "actor", "token", "character", "item", body);
  try {
    fn.call(this, speaker, actor, token, character, item);
  } catch (err) {
    ui.notifications.error(`There was an error in your macro syntax. See the console (F12) for details`);
    console.error(err);
  }
};

/**
 * @param {Document} macro
 * @param {Object} meta
 * @param {Actor} meta.actor
 * @param {String} meta.selectedClass
 * @param {Array.<String>} meta.selectedClasses
 * @returns {Promise}
 */
export const executeCharacterCreationMacro = async (macro, { actor, selectedClass, selectedClasses } = {}) => {
  const body = `(async () => {
      ${macro.data.command}
    })()`;
  const fn = Function("actor", "selectedClass", "selectedClasses", body);
  try {
    fn.call(this, actor, selectedClass, selectedClasses);
  } catch (err) {
    ui.notifications.error(`There was an error in your macro syntax. See the console (F12) for details`);
    console.error(err);
  }
};
