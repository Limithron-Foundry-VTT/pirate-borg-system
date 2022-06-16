import { executeMacro } from "./macro-helpers.js";

/**
 * @param {String} compendiumString
 * @returns {Array.<String>}
 */
export const compendiumInfoFromString = (compendiumString) => compendiumString.split(";");

/**
 * @param {String} compendiumName
 * @param {String} itemName
 * @returns {Promise.<*|undefined>}
 */
export const findCompendiumItem = async (compendiumName, itemName) => {
  const compendium = game.packs.get(compendiumName);
  if (compendium) {
    const documents = await compendium.getDocuments();
    const item = documents.find((i) => i.name === itemName);
    if (!item) {
      console.warn(`findCompendiumItem: Could not find item (${itemName}) in compendium (${compendiumName})`);
    }
    return item;
  }
  console.warn(`findCompendiumItem: Could not find compendium (${compendiumName})`);
};

/**
 * @param {String} compendiumName
 * @param {String} tableName
 * @returns {Promise.<RollTableDraw>}
 */
export const drawTable = async (compendiumName, tableName, options = {}) => {
  const table = await findCompendiumItem(compendiumName, tableName);
  return await table.draw({ displayChat: false, ...options });
};

/**
 * @param {String} compendium
 * @param {String} table
 * @returns {Promise.<String>}
 */
export const drawTableText = async (compendium, table) => (await drawTable(compendium, table)).results[0].getChatText();

/**
 * @param {String} compendium
 * @param {String} table
 * @param {String} formula
 * @returns {Promise.<Array.<PBItem>>}
 */
export const drawTableItem = async (compendium, table) => {
  const draw = await drawTable(compendium, table);
  return await findTableItems(draw.results);
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
  return await rollTable.roll(formula);
};

/**
 * @param {String} compendium
 * @param {String} table
 * @param {String} formula
 * @returns {Promise.<Array.<PBItem>>}
 */
export const rollTableItems = async (compendium, table, formula) => {
  const rollTableItems = await findCompendiumItem(compendium, table);
  const draw = await rollTableItems.roll(formula);
  return await findTableItems(draw.results);
};

/**
 * @param {String} items
 * @returns {Promise.<Array.<PBItem>>}
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
 * @param {Array.<RollTableDraw>} results
 * @returns {Promise.<Array.<PBItem>>}
 */
export const findTableItems = async (results) => {
  const items = [];
  let item = null;
  for (const result of results) {
    if (result.data.type === CONST.TABLE_RESULT_TYPES.COMPENDIUM) {
      item = await findCompendiumItem(result.data.collection, result.data.text);
      if (item) {
        items.push(item);
      }
    } else if (result.data.type === CONST.TABLE_RESULT_TYPES.TEXT && item) {
      const [property, value] = result.getChatText().split(": ");
      const enrichHtml = TextEditor.enrichHTML(value, {
        options: { command: true },
      });
      if (property === "description") {
        item.data.data.description = enrichHtml;
      } else if (property === "quantity") {
        item.data.data.quantity = parseInt($(`<span>${enrichHtml}</span>`).text().trim(), 10);
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
    executeMacro(macro, parameters);
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
  const documents = await compendium.getDocuments();
  return documents.find((i) => i.data.type === "class");
};

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawMysticalMishaps = async (options = {}) => await drawTable("pirateborg.rolls-gamemaster", "Mystical Mishaps", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawDerelictTakesDamage = async (options = {}) => await drawTable("pirateborg.rolls-ships", "Derelict Takes Damage", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawBroken = async (options = {}) => await drawTable("pirateborg.rolls-gamemaster", "Broken", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawReaction = async (options = {}) => await drawTable("pirateborg.rolls-gamemaster", "Reaction", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawGunpowderFumble = async () => await drawTableText("pirateborg.rolls-gamemaster", "Fumble a gunpowder weapons");

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawRelic = async (options = {}) => await drawTable("pirateborg.rolls-character-creation", "d20 Ancient relics", options);

/**
 * @param {Object} options
 * @returns {Promise.<RollTableDraw>}
 */
export const drawRitual = async (options = {}) => await drawTable("pirateborg.rolls-character-creation", "d20 Arcane rituals", options);
