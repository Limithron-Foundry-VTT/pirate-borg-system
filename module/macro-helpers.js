import { diceSound, showDice as rollDice } from "./dice.js";
import { findCompendiumItem } from "./scvm/scvmfactory.js";

export const GENERIC_CHAT_MESSAGE_TEMPLATE = "systems/pirateborg/templates/chat/generic-chat-message-card.html";

export const showDice = rollDice;

export const createChatMessage = async (actor, template, templateData, { muted = false } = {}) => {
  const html = await renderTemplate(template, templateData);
  ChatMessage.create({
    content: html,
    sound: !muted ? diceSound() : false,
    speaker: ChatMessage.getSpeaker({ actor }),
  });
};

export const createRoll = async (formula, rollData = {}) => {
  const roll = new Roll(formula, rollData);
  roll.evaluate({ async: false });
  return roll;
};

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

export const drawTable = async (compendium, table) => {
  const rollTable = await findCompendiumItem(compendium, table);
  return await rollTable.draw();
};
