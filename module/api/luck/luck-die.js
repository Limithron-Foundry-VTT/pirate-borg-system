const DIE_STEPS = [0, 2, 4, 6, 8, 10, 12, 20, 100];

/**
 * Move a die size up or down the standard dice (d0 = no luck). A non-standard die's first step lands on the
 * nearest standard die in that direction.
 * @param {Number} faces
 * @param {Number} steps
 * @returns {Number}
 */
const stepDie = (faces, steps) => {
  let index = DIE_STEPS.indexOf(faces);
  if (index === -1) {
    const above = DIE_STEPS.findIndex((f) => f > faces);
    index = steps > 0 ? (above === -1 ? DIE_STEPS.length : above) - 1 : DIE_STEPS.findLastIndex((f) => f < faces) + 1;
  }
  return DIE_STEPS[Math.min(DIE_STEPS.length - 1, Math.max(0, index + steps))];
};

/**
 * Apply luck die effects to a die formula: step the first die up or down the standard dice (down to d0, which
 * means no luck), then add the result modifier.
 * @param {Object} options
 * @param {String} options.die e.g. "1d2"
 * @param {Number|String} [options.sizeModifier] standard dice steps for the first die (d2 → d4 → d6 ...)
 * @param {Number|String} [options.resultModifier] added to the roll result
 * @returns {String}
 */
export const luckDieFormula = ({ die, sizeModifier = 0, resultModifier = 0 }) => {
  if (!die) return die;
  let formula = die;

  const size = Number(sizeModifier) || 0;
  const match = formula.match(/(\d*)d(\d+)/i);
  if (size && match) {
    const faces = stepDie(Number(match[2]), size);
    if (faces === 0) return "0";
    formula = formula.replace(match[0], `${match[1]}d${faces}`);
  }

  const result = Number(resultModifier) || 0;
  if (result) formula += result > 0 ? `+${result}` : `${result}`;
  return formula;
};
