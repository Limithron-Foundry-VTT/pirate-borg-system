/**
 * @param  {...any} fns
 * @returns {any}
 */
export const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

/**
 * @param  {...Promise.<any>} fns
 * @returns {(x: any) => any>}
 */
export const asyncPipe =
  (...fns) =>
  (x) =>
    fns.reduce(async (y, f) => f(await y), x);

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
 * @param {Document} document
 * @param {string} flag
 * @param {*} value
 */
export const setSystemFlag = async (document, flag, value) => {
  await document.setFlag(CONFIG.PB.flagScope, flag, value);
};

/**
 * @param {Document} document
 * @param {string} flag
 * @returns {*}
 */
export const getSystemFlag = (document, flag) => document.getFlag(CONFIG.PB.flagScope, flag);
