/**
 * Pure ordering rules for Pirate Borg combat.
 * Crew: party d6, 1-3 enemies first, 4-6 PCs first.
 * Ships: d6 + ship AGILITY, highest first, PC ships win ties.
 */

export const SIDE = Object.freeze({ PARTY: "party", ENEMY: "enemy" });
export const KIND = Object.freeze({ SHIP: "ship", CREW: "crew" });
export const MODE = Object.freeze({ SIDE: "side", INDIVIDUAL: "individual" });

/**
 * @typedef {Object} CombatantInfo
 * @property {String} id
 * @property {String} name
 * @property {Number|null} initiative
 * @property {Boolean} isShip
 * @property {String} side - SIDE.PARTY or SIDE.ENEMY
 */

/**
 * @param {CombatantInfo[]} infos
 * @returns {String}
 */
export const getCombatKind = (infos) => (infos.some((c) => c.isShip) ? KIND.SHIP : KIND.CREW);

/**
 * @param {Number|undefined|null} partyInitiative
 * @returns {Boolean}
 */
export const partyGoesFirst = (partyInitiative) => !(partyInitiative >= 1 && partyInitiative <= 3);

/**
 * @param {String} kind
 * @param {String} mode
 * @returns {Boolean}
 */
export const usesSideBasedCombat = (kind, mode) => kind === KIND.CREW && mode === MODE.SIDE;

const UNROLLED = -9999;
const byInitiative = (a, b) => (b.initiative ?? UNROLLED) - (a.initiative ?? UNROLLED);
const partyFirst = (a, b) => (a.side === b.side ? 0 : a.side === SIDE.PARTY ? -1 : 1);
const byName = (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

/**
 * @param {CombatantInfo} a
 * @param {CombatantInfo} b
 * @param {{kind: String, mode: String, partyInitiative?: Number}} options
 * @returns {Number}
 */
export const compareCombatants = (a, b, { kind, mode, partyInitiative }) => {
  if (a.isShip !== b.isShip) return a.isShip ? -1 : 1;
  if (usesSideBasedCombat(kind, mode)) {
    if (a.side !== b.side) return partyGoesFirst(partyInitiative) ? partyFirst(a, b) : -partyFirst(a, b);
    return byName(a, b);
  }
  return byInitiative(a, b) || partyFirst(a, b) || byName(a, b);
};

const getBlockStarts = (infos) => infos.reduce((starts, c, i) => (i === 0 || c.side !== infos[i - 1].side ? [...starts, i] : starts), []);

/**
 * The contiguous same-side run of turns containing index.
 * @param {CombatantInfo[]} infos
 * @param {Number} index
 * @returns {{start: Number, end: Number}}
 */
export const getBlockRange = (infos, index) => {
  let start = index;
  let end = index;
  while (start > 0 && infos[start - 1].side === infos[index].side) start--;
  while (end < infos.length - 1 && infos[end + 1].side === infos[index].side) end++;
  return { start, end };
};

/**
 * @param {CombatantInfo[]} infos
 * @param {Number|null} turn
 * @returns {Number|null} The first turn of the next block, or null when the round is over.
 */
export const getNextBlockStart = (infos, turn) => getBlockStarts(infos).find((start) => start > (turn ?? -1)) ?? null;

/**
 * @param {CombatantInfo[]} infos
 * @param {Number|null} turn
 * @returns {Number|null} The first turn of the previous block, or null when already in the first block.
 */
export const getPreviousBlockStart = (infos, turn) => {
  const starts = getBlockStarts(infos);
  const current = starts.filter((start) => start <= (turn ?? 0)).at(-1) ?? 0;
  return starts.filter((start) => start < current).at(-1) ?? null;
};
