import { OUTCOME_TEST } from "../outcome/outcome.js";
import { playFloatingDamageAnimation, playFloatingOutcomeAnimation } from "./animation.js";

export const ANIMATION_TYPE = {
  RELOADING: "animation-reloading",
  ATTACK: "animation-attack",
  SIMPLE: "animation-simple",
  BROKEN: "animation-broken",
  DEFEND: "animation-defend",
  INFECTED: "animation-infected",
  STARVATION: "animation-starvation",
  TAKE_DAMAGE: "animation-take-damage",
  INFLICT_DAMAGE: "animation-inflict-damage",
  HEAL: "animation-heal",
  MYSTICAL_MISHAP: "animation-mystical-mishap",
};

const criticalStyle = {
  fontSize: 64,
  fill: "#d20608",
};

const damageStyle = {
  fill: "#d20608",
  direction: 1,
  jitter: 0.5,
};

const healStyle = {
  fill: "#00FF00",
  jitter: 0.5,
};

/**
 * @param {Token} token
 * @returns {Promise<void>}
 */
export const playDodgeAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationDodge"));
export const playMissAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationMiss"));
export const playHitAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationHit"));
export const playFumbleAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationFumble"), criticalStyle);
export const playCriticalHitAnimation = async (token) =>
  playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationCriticalHit"), criticalStyle);
export const playSuccessAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationSuccess"));
export const playFailureAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationFailure"));
export const playCriticalSuccessAnimation = async (token) =>
  playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationCriticalSuccess"), criticalStyle);
export const playCriticalFailureAnimation = async (token) =>
  playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationCriticalFailure"), criticalStyle);
export const playReloadingAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationReloading"));
export const playBrokenAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationBroken"));
export const playDeadAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationDead"), criticalStyle);
export const playStarvationAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationStarving"));
export const playInfectedAnimation = async (token) => playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationInfected"));
export const playDamageAnimation = async (token, amount) =>
  playFloatingDamageAnimation(token, game.i18n.format("PB.OutcomeAnimationDamage", { amount }), damageStyle);
export const playHealAnimation = async (token, amount) =>
  playFloatingDamageAnimation(token, game.i18n.format("PB.OutcomeAnimationHeal", { amount }), healStyle);
export const playMysticalMishapAnimation = async (token) =>
  playFloatingOutcomeAnimation(token, game.i18n.localize("PB.OutcomeAnimationMysticalMishap"), criticalStyle);

export const playReloadingOutcomeAnimation = async (outcome) => playReloadingAnimation(outcome.initiatorToken);
export const playDeadOutcomeAnimation = async (outcome) => playDeadAnimation(outcome.initiatorToken);
export const playBrokenOutcomeAnimation = async (outcome) => playBrokenAnimation(outcome.initiatorToken);
export const playStarvationOutcomeAnimation = async (outcome) => playStarvationAnimation(outcome.initiatorToken);
export const playInfectedOutcomeAnimation = async (outcome) => playInfectedAnimation(outcome.initiatorToken);
export const playTakeDamageOutcomeAnimation = async (outcome) => playDamageAnimation(outcome.initiatorToken, outcome.totalDamage);
export const playInflictDamageOutcomeAnimation = async (outcome) => playDamageAnimation(outcome.targetToken, outcome.totalDamage);
export const playHealOutcomeAnimation = async (outcome) => playHealAnimation(outcome.initiatorToken, outcome.heal);
export const playMysticalMishapOutcomeAnimation = async (outcome) => playMysticalMishapAnimation(outcome.initiatorToken);

/**
 * @param {Object} outcome
 */
export const playAttackOutcomeAnimation = async (outcome) => {
  switch (outcome.result) {
    case OUTCOME_TEST.FUMBLE:
      await playFumbleAnimation(outcome.targetToken);
      break;
    case OUTCOME_TEST.CRITICAL_SUCCESS:
      await playCriticalHitAnimation(outcome.targetToken);
      break;
    case OUTCOME_TEST.FAILURE:
      await playMissAnimation(outcome.targetToken);
      break;
    case OUTCOME_TEST.SUCCESS:
      await playHitAnimation(outcome.targetToken);
      break;
  }
};

/**
 * @param {Object} outcome
 */
export const playDefendOutcomeAnimation = async (outcome) => {
  switch (outcome.result) {
    case OUTCOME_TEST.FUMBLE:
      await playFumbleAnimation(outcome.initiatorToken);
      break;
    case OUTCOME_TEST.CRITICAL_SUCCESS:
      await playCriticalSuccessAnimation(outcome.initiatorToken);
      break;
    case OUTCOME_TEST.FAILURE:
      await playHitAnimation(outcome.initiatorToken);
      break;
    case OUTCOME_TEST.SUCCESS:
      await playDodgeAnimation(outcome.initiatorToken);
      break;
  }
};

/**
 * @param {Object} outcome
 */
export const playSimpleOutcomeAnimation = async (outcome) => {
  switch (outcome.result) {
    case OUTCOME_TEST.FUMBLE:
      await playCriticalFailureAnimation(outcome.initiatorToken);
      break;
    case OUTCOME_TEST.CRITICAL_SUCCESS:
      await playCriticalSuccessAnimation(outcome.initiatorToken);
      break;
    case OUTCOME_TEST.FAILURE:
      await playFailureAnimation(outcome.initiatorToken);
      break;
    case OUTCOME_TEST.SUCCESS:
      await playSuccessAnimation(outcome.initiatorToken);
      break;
  }
};

export const playBrokenOrDeadOutcomeAnimation = async (outcome) => {
  switch (true) {
    case outcome.isDead:
      await playDeadOutcomeAnimation(outcome);
      break;
    case !outcome.isDead:
      await playBrokenOutcomeAnimation(outcome);
      break;
  }
};
