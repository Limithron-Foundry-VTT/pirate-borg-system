/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createPirateBorgMacro(data, slot) {
  if (data.type !== "Item") {
    return;
  }
  if (!("data" in data)) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  const item = data.data;
  const supportedItemTypes = ["armor", "feat", "scroll", "hat", "weapon", "invokable"];
  if (!supportedItemTypes.includes(item.type)) {
    return ui.notifications.warn(`Macros only supported for item types: ${supportedItemTypes.join(", ")}`);
  }
  if (item.type === "feature" && (!item.data.rollLabel || (!item.data.rollFormula && !item.data.rollMacro))) {
    // we only allow rollable feats
    return ui.notifications.warn("Macros only supported for features with roll label and either a formula or macro.");
  }

  // Create the macro command
  const command = `game.pirateborg.rollItemMacro("${item.name}");`;
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
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
export function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) {
    actor = game.actors.tokens[speaker.token];
  }
  if (!actor) {
    actor = game.actors.get(speaker.actor);
  }

  // Get matching items
  const items = actor ? actor.items.filter((i) => i.name === itemName) : [];
  if (items.length > 1) {
    ui.notifications.warn(`Your controlled Actor ${actor.name} has more than one Item with name ${itemName}. The first matched item will be chosen.`);
  } else if (items.length === 0) {
    return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
  }
  const item = items[0];

  if (item.data.type === "weapon") {
    actor.attack(item);
  } else if (item.data.type === "armor" || item.data.type === "hat") {
    actor.defend();
  } else if (item.data.type === "scroll") {
    actor.wieldPower();
  } else if (item.data.type === "feat") {
    actor.useFeat(item.id);
  }
}

/**
 * @param {Document} macro
 * @param {Object} meta
 * @param {PBActor} [meta.actor]
 * @param {Token} [meta.token]
 * @param {PBItem} [meta.item]
 */
export const executeMacro = async (macro, { actor, token, item } = {}) => {
  const speaker = ChatMessage.implementation.getSpeaker();
  const { character } = game.user;
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
