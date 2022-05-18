import { findCompendiumItem } from "./scvm/scvmfactory.js";

/**
 * @typedef {Object} RollOutcome
 * @property {Roll} roll
 * @property {Boolean} isSuccess
 * @property {boolean} isFailure
 * @property {Boolean} isFumble
 * @property {Boolean} isCriticalSuccess
 * @property {String} outcome
 */

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
export const drawGunpowderFumble = async (options = {}) => await drawTable("pirateborg.rolls-gamemaster", "Fumble a gunpowder weapons", options);

/**
 * @param {String} formula
 * @param {Object} data
 * @returns {Promise.<Roll>}
 */
export const evaluateFormula = async (formula, data) => {
  const roll = new Roll(formula, data);
  return await roll.evaluate({ async: true });
};

/**
 * @param {Roll} roll
 * @param {Number} dr
 * @returns {RollOutcome}
 */
export const getRollOutcome = (roll, dr = 12) => {
  const dieResult = roll.terms[0].results[0].result;

  const rollResult = {
    roll,
    isSuccess: roll.total >= dr,
    isFailure: roll.total < dr,
    isFumble: dieResult === 1,
    isCriticalSuccess: dieResult === 20,
  };

  if (rollResult.isFumble) {
    rollResult.outcome = CONFIG.PB.outcome.fumble;
  } else if (rollResult.isCriticalSuccess) {
    rollResult.outcome = CONFIG.PB.outcome.critical_success;
  } else if (rollResult.isSuccess) {
    rollResult.outcome = CONFIG.PB.outcome.success;
  } else {
    rollResult.outcome = CONFIG.PB.outcome.failure;
  }

  return rollResult;
};
