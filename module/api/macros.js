import { characterAttackAction } from "./action/character/character-attack-action.js";
import { characterDefendAction } from "./action/character/character-defend-action.js";
import { characterInvokeRitualAction } from "./action/character/character-invoke-ritual-action.js";
import { characterInvokeRelicAction } from "./action/character/character-invoke-relic-action.js";
import { characterInvokeExtraResourceAction } from "./action/character/character-invoke-extra-resource-action.js";
import { characterUseItemAction } from "./action/character/character-use-item-action.js";
import { getInfoFromDropData, getMacroCommand } from "./utils.js";

/**
 * @param {Object} data
 * @param {Number} slot
 * @return {boolean} - Returns whether Foundry VTT should continue with the default macro
 * creation workflow (true means yes, false means no).
 */
export const createPirateBorgMacro = (data, slot) => {
  if (data.type === "Action" && data.action === "defend") {
    const sceneId = data.sceneId ?? "";
    const tokenId = data.tokenId ?? "";
    const actor = sceneId && tokenId ? game.scenes.get(sceneId)?.tokens?.get(tokenId)?.actor : game.actors.get(data.actorId);

    if (!actor) {
      ui.notifications.warn("You can only create macro buttons for owned Actors");
      return true;
    }

    const command = `game.pirateborg.api.macros.rollDefendMacro("${actor.id}", "${tokenId}", "${sceneId}");`;
    const name = game.i18n.localize("PB.Defend");
    const macro = game.macros.find((m) => m.name === name && m.command === command);
    if (!macro) {
      Macro.create({
        name,
        type: "script",
        img: "systems/pirateborg/icons/misc/armor.png",
        command,
        flags: { "pirateborg.defendMacro": true },
      }).then((m) => {
        game.user.assignHotbarMacro(m, slot);
      });
    } else {
      game.user.assignHotbarMacro(macro, slot);
    }
    return false;
  }

  const { item, actor } = getInfoFromDropData(data);

  if (data.type !== "Item") {
    return true;
  }

  if (!actor) {
    ui.notifications.warn("You can only create macro buttons for owned Items");
    return true;
  }

  const supportedItemTypes = ["armor", "hat", "weapon", "invokable", "feature", "misc"];
  if (!supportedItemTypes.includes(item.type)) {
    ui.notifications.warn(`Macros only supported for item types: ${supportedItemTypes.join(", ")}`);
    return true;
  }

  if (["feature", "misc"].includes(item.type) && !item.actionMacro) {
    ui.notifications.warn("Macros only supported for features and items with a macro.");
    return true;
  }

  const command = `game.pirateborg.api.macros.rollItemMacro("${actor.id}", "${item.id}");`;
  const macro = game.macros.find((m) => m.name === item.name && m.command === command);
  if (!macro) {
    Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command,
      flags: { "pirateborg.itemMacro": true },
    }).then((m) => {
      game.user.assignHotbarMacro(m, slot);
    });
  } else {
    game.user.assignHotbarMacro(macro, slot);
  }

  // Prevent the default Foundry VTT macro creation workflow
  return false;
};

/**
 * @param {string} actorId
 * @param {string} itemId
 * @return {Promise.<void>}
 */
export const rollItemMacro = async (actorId, itemId) => {
  const actor = game.actors.get(actorId);
  const item = actor.items.get(itemId);

  if (!item && !actor) {
    return ui.notifications.warn(`Actor "${actor.name}" does not have an item named ${item.name}`);
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
 * @param {string} actorId
 * @param {string} [tokenId]
 * @param {string} [sceneId]
 * @return {Promise.<void>}
 */
export const rollDefendMacro = async (actorId, tokenId = null, sceneId = null) => {
  let actor = null;
  if (sceneId && tokenId) {
    actor = game.scenes.get(sceneId)?.tokens?.get(tokenId)?.actor;
  }
  if (!actor) {
    actor = game.actors.get(actorId);
  }

  if (!actor) {
    return ui.notifications.warn("Could not find the actor for this macro.");
  }

  return characterDefendAction(actor);
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
      ${getMacroCommand(macro)}
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
      ${getMacroCommand(macro)}
    })()`;
  const fn = Function("actor", "selectedClass", "selectedClasses", body);
  try {
    fn.call(this, actor, selectedClass, selectedClasses);
  } catch (err) {
    ui.notifications.error(`There was an error in your macro syntax. See the console (F12) for details`);
    console.error(err);
  }
};
