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
 * @param {Object} options
 * @param {Number} options.critOn
 * @param {Number} options.fumbleOn
 * @returns {RollOutcome}
 */
export const getTestOutcome = (roll, dr = 12, { critOn = 20, fumbleOn = 1 } = {}) => {
  const dieResult = roll.terms[0].results[0].result;

  const rollResult = {
    roll,
    isSuccess: roll.total >= dr,
    isFailure: roll.total < dr,
    isFumble: dieResult <= fumbleOn,
    isCriticalSuccess: dieResult >= critOn,
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
