import { isOutcomeAnimationEnabled } from "../../system/settings.js";
import { OUTCOME_TEST } from "../outcome/outcome.js";
import { isSequencerEnabled } from "./animation.js";

export const ANIMATION_TYPE = {
  RELOADING: "reloading",
  ATTACK: "attack",
  SIMPLE: "simple",
  BROKEN: "broken",
  DEFEND: "defend",
  INFECTED: "infected",
  STARVATION: "starvation",
};

const ANIMATION = {
  DODGE: "/systems/pirateborg/ui/animation/dodge.webm",
  MISS: "/systems/pirateborg/ui/animation/miss.webm",
  HIT: "/systems/pirateborg/ui/animation/hit.webm",
  CRITICAL_HIT: "/systems/pirateborg/ui/animation/critical-hit.webm",
  FUMBLE: "/systems/pirateborg/ui/animation/fumble.webm",
  SUCCESS: "/systems/pirateborg/ui/animation/success.webm",
  FAILURE: "/systems/pirateborg/ui/animation/failure.webm",
  CRITICAL_FAILURE: "/systems/pirateborg/ui/animation/critical-failure.webm",
  CRITICAL_SUCCESS: "/systems/pirateborg/ui/animation/critical-success.webm",
  RELOADING: "/systems/pirateborg/ui/animation/reloading.webm",
  BROKEN: "/systems/pirateborg/ui/animation/broken.webm",
  DEAD: "/systems/pirateborg/ui/animation/dead.webm",
  INFECTED: "/systems/pirateborg/ui/animation/infected.webm",
  STARVATION: "/systems/pirateborg/ui/animation/starving.webm",
};

/**
 * @returns {Boolean}
 */
export const isOutcomeAnimationSupported = () => isSequencerEnabled() && isOutcomeAnimationEnabled();

/**
 * @param {String} token
 * @param {String} animation
 */
export const playOutcomeAnimation = async (tokenId, animation) => {
  if (!isOutcomeAnimationSupported()) return;

  const token = canvas.tokens.get(tokenId);

  if (!token) return;

  new Sequence()
    .effect(animation)
    .atLocation(token)
    .anchor({ x: 0.5, y: 1.3 })
    .duration(3000)
    .noLoop(true)
    //
    .play();
};

export const playDodgeAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.DODGE);
export const playMissAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.MISS);
export const playHitAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.HIT);
export const playFumbleAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.FUMBLE);
export const playCriticalHitAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.CRITICAL_HIT);
export const playSuccessAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.SUCCESS);
export const playFailureAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.FAILURE);
export const playCriticalSuccessAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.CRITICAL_SUCCESS);
export const playCriticalFailureAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.CRITICAL_FAILURE);
export const playReloadingAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.RELOADING);
export const playBrokenAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.BROKEN);
export const playDeadAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.DEAD);
export const playStarvationAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.STARVATION);
export const playInfectedAnimation = async (token) => await playOutcomeAnimation(token, ANIMATION.INFECTED);

export const playReloadingOutcomeAnimation = async (outcome) => await playReloadingAnimation(outcome.initiatorToken);
export const playDeadOutcomeAnimation = async (outcome) => await playDeadAnimation(outcome.initiatorToken);
export const playBrokenOutcomeAnimation = async (outcome) => await playBrokenAnimation(outcome.initiatorToken);
export const playStarvationOutcomeAnimation = async (outcome) => await playStarvationAnimation(outcome.initiatorToken);
export const playOutcomeInfectedAnimation = async (outcome) => await playInfectedAnimation(outcome.initiatorToken);

/**
 * @param {Outcome} outcome
 */
export const playAttackOutcomeAnimation = async (outcome) => {
  console.log('playAttackOutcomeAnimation', outcome)
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
 * @param {Outcome} outcome
 */
export const playDefendOutcomeAnimation = async (outcome) => {
  console.log('playDefendOutcomeAnimation', outcome)
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
 * @param {Outcome} outcome
 */
export const playSimpleOutcomeAnimation = async (outcome) => {
  console.log('playSimpleOutcomeAnimation', outcome)
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
