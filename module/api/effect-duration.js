/**
 * Compatibility helpers for ActiveEffect.duration.
 *
 * Foundry VTT v14 ("Active Effects V2") replaced the legacy ActiveEffect.duration
 * schema. v12/v13 expect `{ rounds | seconds | turns, ... }`; v14 expects
 * `{ value, units, expiry }` with `value: number | null` and `units` being one of
 * "years"|"months"|"days"|"hours"|"minutes"|"seconds"|"rounds"|"turns". To support
 * the full v12+ range declared in system.json, this module writes BOTH shapes so
 * v12/v13 see their legacy keys and v14 sees a valid `value`/`units` pair.
 */

const V14_THRESHOLD = "13.999";

/**
 * @returns {boolean} true when the running Foundry version is v14 or newer.
 */
const isV14OrNewer = () => {
  try {
    return foundry.utils.isNewerVersion(game.version, V14_THRESHOLD);
  } catch (_err) {
    return false;
  }
};

/**
 * Build an `ActiveEffect.duration` object that is valid on Foundry v12, v13, and
 * v14+. The first legacy unit found among `rounds`, `turns`, `seconds` (in that
 * order) is mirrored into the v14 `value`/`units` pair when running on v14+.
 *
 * @param {Object} [input]
 * @param {Number} [input.rounds]
 * @param {Number} [input.turns]
 * @param {Number} [input.seconds]
 * @param {Number} [input.startRound]
 * @param {Number} [input.startTurn]
 * @returns {Object}
 */
export const buildEffectDuration = ({ rounds, turns, seconds, startRound, startTurn } = {}) => {
  const duration = {};
  let value = null;
  let units = null;

  if (rounds !== undefined && rounds !== null) {
    duration.rounds = rounds;
    value = rounds;
    units = "rounds";
  } else if (turns !== undefined && turns !== null) {
    duration.turns = turns;
    value = turns;
    units = "turns";
  } else if (seconds !== undefined && seconds !== null) {
    duration.seconds = seconds;
    value = seconds;
    units = "seconds";
  }

  if (isV14OrNewer() && value !== null) {
    duration.value = value;
    duration.units = units;
  }

  if (startRound !== undefined && startRound !== null) {
    duration.startRound = startRound;
  }
  if (startTurn !== undefined && startTurn !== null) {
    duration.startTurn = startTurn;
  }

  return duration;
};

/**
 * Normalize an existing duration object (typically copied from a compendium item)
 * so it is valid on the running Foundry version. When running on v14+, this
 * ensures the duration carries the `value`/`units` pair derived from whichever
 * legacy key (`rounds`/`turns`/`seconds`) is present. Legacy keys are preserved
 * so the same object continues to validate on v12/v13.
 *
 * @param {Object} [duration]
 * @returns {Object|undefined} the same object reference, mutated, or undefined if no input.
 */
export const normalizeEffectDuration = (duration) => {
  if (!duration || typeof duration !== "object") return duration;
  if (!isV14OrNewer()) return duration;

  if (typeof duration.value === "number" && typeof duration.units === "string") {
    return duration;
  }

  if (typeof duration.rounds === "number") {
    duration.value = duration.rounds;
    duration.units = "rounds";
  } else if (typeof duration.turns === "number") {
    duration.value = duration.turns;
    duration.units = "turns";
  } else if (typeof duration.seconds === "number") {
    duration.value = duration.seconds;
    duration.units = "seconds";
  }

  return duration;
};

/**
 * Walk the `effects` array of an item-like data object and normalize each
 * embedded effect's `duration` for the current Foundry version. Safe to call on
 * objects without effects.
 *
 * @param {Object} [itemData]
 * @returns {Object|undefined} the same object reference, mutated.
 */
export const normalizeItemEffectDurations = (itemData) => {
  if (!itemData || !Array.isArray(itemData.effects)) return itemData;
  for (const effect of itemData.effects) {
    if (effect && effect.duration) {
      normalizeEffectDuration(effect.duration);
    }
  }
  return itemData;
};
