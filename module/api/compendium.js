import { executeMacro } from "./macros.js";
import { getResultCollection, getResultText, getResultType } from "./utils.js";

/**
 * @param {String} compendiumString
 * @returns {Array.<String>}
 */
export const compendiumInfoFromString = (compendiumString) => compendiumString.split(";");

/**
 * @param {String} compendiumName
 * @param {String} itemName
 * @returns {Promise.<PBItem|RollTable|undefined>}
 */
export const findCompendiumItem = async (compendiumName, itemName) => {
  const compendium = game.packs.get(compendiumName);
  if (compendium) {
    await compendium.getIndex({ fields: ["name"] });
    const item = compendium.index.find((i) => i.name === itemName);
    if (!item) {
      console.warn(`findCompendiumItem: Could not find item (${itemName}) in compendium (${compendiumName})`);
    }
    return compendium.getDocument(item._id);
  }
  console.warn(`findCompendiumItem: Could not find compendium (${compendiumName})`);
};

/**
 * @param {String} compendiumName
 * @param {String} tableName
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawTable = async (compendiumName, tableName, options = {}) => {
  const table = await findCompendiumItem(compendiumName, tableName);
  return table.draw({ displayChat: false, ...options });
};

/**
 * @param {String} compendium
 * @param {String} table
 * @returns {Promise.<String>}
 */
export const drawTableText = async (compendium, table) => {
  const result = (await drawTable(compendium, table)).results[0];

  if (game.release.generation >= 13) {
    return result.description;
  }
  return result.getChatText();
};

/**
 * @param {String} compendium
 * @param {String} table
 * @returns {Promise.<PBItem[]>}
 */
export const drawTableItem = async (compendium, table) => {
  const draw = await drawTable(compendium, table);
  return findTableItems(draw.results);
};

/**
 * @param {String} compendium
 * @param {String} table
 * @param {Number} amount
 * @returns {Promise.<Array.<PBItem>>}
 */
export const drawTableItems = async (compendium, table, amount) => {
  let results = [];
  for (let i = 0; i < amount; i++) {
    results = results.concat(await drawTableItem(compendium, table));
  }
  return results;
};

/**
 * @param {String} compendium
 * @param {String} table
 * @param {String} formula
 * @returns {Promise.<RollTableDraw>}
 */
export const rollTable = async (compendium, table, formula) => {
  const rollTable = await findCompendiumItem(compendium, table);
  return rollTable.roll({ roll: new Roll(formula) });
};

/**
 * @param {String} compendium
 * @param {String} table
 * @param {String} formula
 * @returns {Promise.<Array.<PBItem>>}
 */
export const rollTableItems = async (compendium, table, formula) => {
  const draw = await rollTable(compendium, table, formula);
  return findTableItems(draw.results);
};

/**
 @param {String} compendiumString
 * @returns {Promise.<PBItem[]>}
 */
export const findItemsFromCompendiumString = async (compendiumString) => {
  const compendiumsItems = compendiumString.split("\n").filter((item) => item);
  const results = [];
  for (const compendiumsItem of compendiumsItems) {
    const [compendium, table] = compendiumInfoFromString(compendiumsItem);
    results.push(await findCompendiumItem(compendium, table));
  }
  return results;
};

/**
 * @param {TableResult[]} results
 * @returns {Promise.<PBItem[]>}
 */
export const findTableItems = async (results) => {
  const items = [];
  let item = null;
  for (const result of results) {
    const type = getResultType(result);
    if (type === (game.release.generation >= 13 ? CONST.TABLE_RESULT_TYPES.DOCUMENT : CONST.TABLE_RESULT_TYPES.COMPENDIUM)) {
      item = await findCompendiumItem(getResultCollection(result), getResultText(result));
      if (item) {
        items.push(item);
      }
    } else if (type === CONST.TABLE_RESULT_TYPES.TEXT && item) {
      let resultText;
      if (game.release.generation >= 13) {
        resultText = result.description;
      } else {
        resultText = result.getChatText();
      }
      const [property, value] = resultText.split(": ");
      const enrichHtml = (game.release.generation >= 13 ? foundry.applications.ux.TextEditor.implementation : TextEditor).enrichHTML(value, {
        options: { command: true },
        async: false,
      });
      if (property === "description") {
        item.getData().description = enrichHtml;
      } else if (property === "quantity") {
        item.getData().quantity = parseInt($(`<span>${enrichHtml}</span>`).text().trim(), 10);
      }
    }
  }
  return items;
};

/**
 * @param {String} compendiumMacro
 * @param {Object} parameters
 */
export const executeCompendiumMacro = async (compendiumMacro, parameters = {}) => {
  const [compendium, macroName] = compendiumInfoFromString(compendiumMacro || "");
  if (compendium && macroName) {
    const macro = await findCompendiumItem(compendium, macroName);
    await executeMacro(macro, parameters);
  }
};

/**
 * @returns {Array.<String>}
 */
export const findClassPacks = () => [...game.packs.keys()].filter((pack) => pack.lastIndexOf(".class-") > 0);

/**
 * @param {String} compendiumName
 * @returns {Promise.<PBItem>}
 */
export const classItemFromPack = async (compendiumName) => {
  const compendium = game.packs.get(compendiumName);
  await compendium.getIndex({ fields: ["type"] });
  const item = compendium.index.find((i) => i.type === "class");
  if (!item) {
    return null;
  }
  return compendium.getDocument(item._id);
};

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawMysticalMishaps = async (options = {}) => drawTable("pirateborg.rolls-gamemaster", "Mystical Mishaps", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawDerelictTakesDamage = async (options = {}) => drawTable("pirateborg.rolls-ships", "Derelict Takes Damage", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawBroken = async (options = {}) => drawTable("pirateborg.rolls-gamemaster", "Broken", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawReaction = async (options = {}) => drawTable("pirateborg.rolls-gamemaster", "Reaction", options);

/**
 * @returns {Promise.<String>}
 */
export const drawGunpowderFumble = async () => drawTableText("pirateborg.rolls-gamemaster", "Fumble a gunpowder weapons");

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawRelic = async (options = {}) => drawTable("pirateborg.rolls-character-creation", "d20 Ancient relics", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawRitual = async (options = {}) => drawTable("pirateborg.rolls-character-creation", "d20 Arcane rituals", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawWeapon = async (options = {}) => drawTable("pirateborg.rolls-character-creation", "d10 Starting weapons", options);
