/**
 * ActiveEffect.duration helpers that emit both the legacy (v12/v13) and v14+
 * (Active Effects V2) shapes so the same object validates across all versions
 * declared in system.json.
 */

const isV14OrNewer = () => (game?.release?.generation ?? 0) >= 14;

/**
 * @param {{ rounds?: Number, turns?: Number, seconds?: Number, startRound?: Number, startTurn?: Number }} [input]
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
 * Upgrade a duration object so `value`/`units` are present on v14+ without
 * dropping legacy keys. Missing/empty durations default to indefinite.
 *
 * @param {Object} [duration]
 * @returns {Object}
 */
export const normalizeEffectDuration = (duration) => {
  const target = duration && typeof duration === "object" ? duration : {};
  if (!isV14OrNewer()) return target;

  if (typeof target.value === "number" || target.value === null) {
    if (typeof target.units !== "string") target.units = "seconds";
    return target;
  }

  if (typeof target.rounds === "number") {
    target.value = target.rounds;
    target.units = "rounds";
  } else if (typeof target.turns === "number") {
    target.value = target.turns;
    target.units = "turns";
  } else if (typeof target.seconds === "number") {
    target.value = target.seconds;
    target.units = "seconds";
  } else {
    target.value = null;
    target.units = "seconds";
  }

  return target;
};

/**
 * @param {Object} [itemData]
 * @returns {Object|undefined}
 */
export const normalizeItemEffectDurations = (itemData) => {
  if (!itemData || !Array.isArray(itemData.effects)) return itemData;
  for (const effect of itemData.effects) {
    if (!effect) continue;
    effect.duration = normalizeEffectDuration(effect.duration);
  }
  return itemData;
};
