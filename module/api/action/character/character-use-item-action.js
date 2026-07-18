import { compendiumInfoFromString, findCompendiumItem } from "../../compendium.js";
import { executeMacro } from "../../macros.js";
import { isJokerTableItem, isLuckyDevilItem } from "../../luck/luck-consume-features.js";
import { characterShowDevilLuckAction } from "./character-show-devil-luck-action.js";
import { characterShowJokerTableAction } from "./character-show-joker-table-action.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @param {Object} [outcome]
 * @param {ChatMessage} [chatMessage]
 * @returns {Promise.<Object>}
 */
export const characterUseItemAction = async (actor, item, outcome = null, chatMessage = null) => {
  if (isLuckyDevilItem(item)) {
    return characterShowDevilLuckAction(actor);
  }
  if (isJokerTableItem(item)) {
    return characterShowJokerTableAction(actor);
  }

  if (!item.actionMacro) {
    return;
  }

  const actionValue = String(item.actionMacro).trim();

  /** @type {Document|undefined} */
  let target;

  // 1) UUID support (world or compendium): Macro.<id> / RollTable.<id> or Compendium.<pack>.<id>
  if (actionValue.startsWith("Macro.") || actionValue.startsWith("RollTable.") || actionValue.startsWith("Compendium.")) {
    try {
      target = await fromUuid(actionValue);
    } catch {
      // ignore and fall through to other strategies
    }
  }

  // 2) Compendium + name format: "compendium;name"
  if (!target && actionValue.includes(";")) {
    const [compendium, name] = compendiumInfoFromString(actionValue);
    if (compendium && name) {
      target = await findCompendiumItem(compendium, name);
    }
  }

  // 3) World macro or rolltable by name
  if (!target) {
    const name = actionValue;
    target = game.macros.find((m) => m.name === name) || game.tables?.find?.((t) => t.name === name);
  }

  if (!target) {
    ui.notifications?.warn?.(
      `Action target "${actionValue}" not found for item "${item?.name}". ` +
        `Check that the macro, roll table, or compendium reference is correct and available.`,
    );
    return;
  }

  // Execute Macro or draw RollTable
  const documentName = /** @type {string} */ target.documentName;
  if (documentName === "Macro") {
    return executeMacro(target, { actor, item, outcome, chatMessage });
  }
  if (documentName === "RollTable") {
    return target.draw({ displayChat: true });
  }

  ui.notifications?.warn?.(`Unsupported action target type "${documentName}" for item "${item?.name}". Supported types are "Macro" and "RollTable".`);
};
