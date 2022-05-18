import { findCompendiumItem } from "./scvm/scvmfactory.js";

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
 * @returns {Promise.<{isSuccess: Boolean, isFailure: Boolean, isFumble: Boolean, isCriticalSuccess: Boolean, outcome: String}>}
 */
export const getRollOutcome = (roll, dr = 12) => {
  const dieResult = roll.dice[0].total;

  const rollResult = {
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
