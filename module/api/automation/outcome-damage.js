import { isAutomaticDamageEnabled } from "../../system/settings.js";

export const DAMAGE_TYPE = {
  HEAL: "heal",
  INFLICT: "inflict",
  TAKE: "take",
};

/**
 * @param {Object} outcome
 * @param {String} tokenId
 * @param {Function} fn
 * @returns
 */
 export const applyOnToken = async (outcome, tokenId, fn) => {
  const token = canvas.tokens.get(tokenId);
  const isValid = token && token?.actor && isAutomaticDamageEnabled();

  if (!isValid) return;

  await fn(outcome, token.actor);
};


/**
 * @param {Outcome} outcome
 * @returns {Promise}
 */
export const applyHealOutcome = async (outcome) => {
  await applyOnToken(outcome, outcome.initiatorToken, async (outcome, actor) => {
    await actor.updateHp({
      value: Math.min(actor.hp.value + outcome.heal, actor.hp.max),
    });
  });
};

/**
 * @param {Outcome} outcome
 * @returns {Promise}
 */
export const applyInflictDamageOutcome = async (outcome) => {
  await applyOnToken(outcome, outcome.targetToken, async (outcome, actor) => {
    await actor.updateHp({
      value: Math.min(actor.hp.value - outcome.totalDamage, actor.hp.max),
    });
  });
};

/**
 * @param {Outcome} outcome
 * @returns {Promise}
 */
export const applyTakeDamageOutcome = async (outcome) => {
  await applyOnToken(outcome, outcome.initiatorToken, async (outcome, actor) => {
    await actor.updateHp({
      value: Math.min(actor.hp.value - outcome.totalDamage, actor.hp.max),
    });
  });
};