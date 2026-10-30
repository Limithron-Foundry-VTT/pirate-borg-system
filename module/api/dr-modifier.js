/**
 * Apply the actor's DR modifier to a test's DR.
 * @param {Number} dr base DR
 * @param {Number} total applied system.attributes.combat.drModifier
 * @param {Array.<{name: String, value: Number}>} effects source effects
 * @returns {{dr: Number, drLabel?: String}}
 */
export const modifyDR = (dr, total = 0, effects = []) =>
  total ? { dr: dr + total, drLabel: [dr, ...effects.map(({ name, value }) => `${value > 0 ? "+" : ""}${value} from ${name}`)].join(", ") } : { dr };
