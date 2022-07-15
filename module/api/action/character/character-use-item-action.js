import { compendiumInfoFromString, findCompendiumItem } from "../../compendium.js";
import { executeMacro } from "../../macros.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @param {Object} [outcome]
 * @param {ChatMessage} [chatMessage]
 * @returns {Promise.<Object>}
 */
export const characterUseItemAction = async (actor, item, outcome = null, chatMessage = null) => {
  if (!item.actionMacro) {
    return;
  }

  const [compendium, macroName] = compendiumInfoFromString(item.actionMacro);
  if (compendium && macroName) {
    const macro = await findCompendiumItem(compendium, macroName);
    await executeMacro(macro, { actor, item, outcome, chatMessage });
  } else {
    const macro = game.macros.find((m) => m.name === macroName);
    await executeMacro(macro, { actor, item, outcome, chatMessage });
  }
};
