/**
 * ActiveEffect.duration helpers that emit both the legacy (v12/v13) and v14+
 * (Active Effects V2) shapes so the same object validates across all versions
 * declared in system.json.
 */

const isV14OrNewer = () => (game?.release?.generation ?? 0) >= 14;

const toInteger = (n) => {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return Math.trunc(n);
};

/**
 * @param {{ rounds?: Number, turns?: Number, seconds?: Number, startRound?: Number, startTurn?: Number }} [input]
 * @returns {Object}
 */
export const buildEffectDuration = ({ rounds, turns, seconds, startRound, startTurn } = {}) => {
  const duration = {};
  let value = null;
  let units = null;

  if (rounds !== undefined && rounds !== null) {
    duration.rounds = toInteger(rounds) ?? rounds;
    value = toInteger(rounds);
    units = "rounds";
  } else if (turns !== undefined && turns !== null) {
    duration.turns = toInteger(turns) ?? turns;
    value = toInteger(turns);
    units = "turns";
  } else if (seconds !== undefined && seconds !== null) {
    duration.seconds = toInteger(seconds) ?? seconds;
    value = toInteger(seconds);
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
 * dropping legacy keys. Missing/empty/null durations stay indefinite (omit `value`).
 *
 * @param {Object} [duration]
 * @returns {Object}
 */
export const normalizeEffectDuration = (duration) => {
  const target = duration && typeof duration === "object" ? duration : {};
  if (!isV14OrNewer()) return target;

  let value = null;
  let units = typeof target.units === "string" ? target.units : null;

  if (typeof target.value === "number") {
    value = toInteger(target.value);
  } else if (typeof target.rounds === "number") {
    value = toInteger(target.rounds);
    units = "rounds";
  } else if (typeof target.turns === "number") {
    value = toInteger(target.turns);
    units = "turns";
  } else if (typeof target.seconds === "number") {
    value = toInteger(target.seconds);
    units = "seconds";
  }

  if (value !== null) {
    target.value = value;
    target.units = units || "seconds";
  } else {
    delete target.value;
    if (typeof target.units !== "string") target.units = "seconds";
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

/**
 * @param {Object} [documentData]
 * @returns {Object|undefined}
 */
export const normalizeDocumentEffectDurations = (documentData) => {
  if (!documentData || typeof documentData !== "object") return documentData;
  if (Array.isArray(documentData.effects)) {
    for (const effect of documentData.effects) {
      if (!effect) continue;
      effect.duration = normalizeEffectDuration(effect.duration);
    }
  }
  if (Array.isArray(documentData.items)) {
    for (const item of documentData.items) normalizeItemEffectDurations(item);
  }
  return documentData;
};
