import { characterAttackAction } from "./action/character/character-attack-action.js";
import { characterDefendAction } from "./action/character/character-defend-action.js";
import { characterInvokeRitualAction } from "./action/character/character-invoke-ritual-action.js";
import { characterInvokeRelicAction } from "./action/character/character-invoke-relic-action.js";
import { characterInvokeExtraResourceAction } from "./action/character/character-invoke-extra-resource-action.js";
import { characterUseItemAction } from "./action/character/character-use-item-action.js";

/**
 * @param {Object} data
 * @param {Number} slot
 * @return {Promise.<void>}
 */
export const createPirateBorgMacro = async (data, slot) => {
  if (data.type !== "Item") {
    return;
  }

  if (!("data" in data)) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }

  const item = data.data;
  const supportedItemTypes = ["armor", "hat", "weapon", "invokable", "feature", "misc"];
  if (!supportedItemTypes.includes(item.type)) {
    return ui.notifications.warn(`Macros only supported for item types: ${supportedItemTypes.join(", ")}`);
  }

  if (["feature", "misc"].includes(item.type) && !item.data.actionMacro) {
    return ui.notifications.warn("Macros only supported for features and items with a macro.");
  }

  const command = `game.pirateborg.api.macros.rollItemMacro("${item.name}");`;
  let macro = game.macros.find((m) => m.name === item.name && m.command === command);
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command,
      flags: { "pirateborg.itemMacro": true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
};

/**
 * @param {string} itemName
 * @return {Promise.<void>}
 */
export const rollItemMacro = async (itemName) => {
  const speaker = ChatMessage.getSpeaker();
  const actor = game.actors.tokens[speaker.token] ?? game.actors.get(speaker.actor);

  const item = actor?.items.find((i) => i.name === itemName);

  if (!item) {
    return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
  }

  switch (true) {
    case item.isWeapon:
      return characterAttackAction(actor, item);
    case item.isArmor || item.isHat:
      return characterDefendAction(actor);
    case item.isArcaneRitual:
      return characterInvokeRitualAction(actor, item);
    case item.isAncientRelic:
      return characterInvokeRelicAction(actor, item);
    case item.isInvokable && item.isExtraResource:
      return characterInvokeExtraResourceAction(actor, item);
    case item.isFeature || item.isMisc:
      return characterUseItemAction(actor, item);
  }
};

/**
 * @param {Document} macro
 * @param {Object} options
 * @param {PBActor} [options.actor]
 * @param {Token} [options.token]
 * @param {PBItem} [options.item]
 * @param {Object} [options.outcome]
 * @param {ChatMessage} [options.chatMessage]
 */
export const executeMacro = async (macro, { actor, token, item, outcome, chatMessage } = {}) => {
  const speaker = ChatMessage.implementation.getSpeaker();
  const { character } = game.user;
  actor = actor || game.actors.get(speaker.actor);
  token = token || (canvas.ready ? canvas.tokens.get(speaker.token) : null);
  const body = `(async () => {
      ${macro.data.command}
    })()`;

  const fn = Function("speaker", "actor", "token", "character", "item", "outcome", "chatMessage", body);
  try {
    fn.call(this, speaker, actor, token, character, item, outcome, chatMessage);
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
