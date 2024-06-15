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
  if (!tokenId && !outcome.initiatorActor) return;
  let actor;
  const token = canvas.tokens.get(tokenId);
  if (token?.actor) {
    actor = token.actor;
  } else if (outcome.initiatorActor) {
    actor = game.actors.get(outcome.initiatorActor);
  }
  const isValid = actor && isAutomaticDamageEnabled();

  if (!isValid) return;

  await fn(outcome, actor);
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
