import { isAutomaticDamageEnabled } from "../../system/settings.js";

export const DAMAGE_TYPE = {
  HEAL: "damage-heal",
  INFLICT: "damage-inflict",
  TAKE: "damage-take",
};

/**
 * @param {Object} outcome
 * @param {String} tokenId
 * @param {function(Object, PBActor)} fn
 * @return {Promise<void>}
 */
export const applyOnToken = async (outcome, tokenId, fn) => {
  const token = canvas.tokens.get(tokenId);
  const isValid = token && token?.actor && isAutomaticDamageEnabled();

  if (!isValid) return;

  await fn(outcome, token.actor);
};

/**
 * @param {Object} outcome
 * @return {Promise<void>}
 */
export const applyHealOutcome = async (outcome) => {
  await applyOnToken(outcome, outcome.initiatorToken, async (outcome, actor) => {
    await actor.updateHp({
      value: Math.min(actor.hp.value + outcome.heal, actor.hp.max),
    });
  });
};

/**
 * @param {Object} outcome
 * @return {Promise<void>}
 */
export const applyInflictDamageOutcome = async (outcome) => {
  await applyOnToken(outcome, outcome.targetToken, async (outcome, actor) => {
    await actor.updateHp({
      value: Math.min(actor.hp.value - outcome.totalDamage, actor.hp.max),
    });
  });
};

/**
 * @param {Object} outcome
 * @return {Promise<void>}
 */
export const applyTakeDamageOutcome = async (outcome) => {
  await applyOnToken(outcome, outcome.initiatorToken, async (outcome, actor) => {
    await actor.updateHp({
      value: Math.min(actor.hp.value - outcome.totalDamage, actor.hp.max),
    });
  });
};
