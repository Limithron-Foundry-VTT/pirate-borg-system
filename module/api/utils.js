/**
 * @param {function[]} fns
 * @return {function(*): *}
 */
export const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

/**
 * @param {function(*): Promise<*>} fns
 * @return {function(*): Promise<*>}
 */
export const asyncPipe =
  (...fns) =>
  (x) =>
    fns.reduce(async (y, f) => f(await y), x);

/**
 * @param {String} formula
 * @param {Object} [data]
 * @return {Promise<Roll>}
 */
export const evaluateFormula = async (formula, data) => {
  const roll = new Roll(formula, data);
  return roll.evaluate({ async: true });
};

/**
 * @param {foundry.abstract.Document} document
 * @param {any} flag
 * @param {any} value
 * @return {Promise<any>}
 */
export const setSystemFlag = async (document, flag, value) => document.setFlag(CONFIG.PB.flagScope, flag, value);

/**
 * @param {foundry.abstract.Document} document
 * @param {any} flag
 * @return {any}
 */
export const getSystemFlag = (document, flag) => document.getFlag(CONFIG.PB.flagScope, flag);
