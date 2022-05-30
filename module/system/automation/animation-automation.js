import { isAttackAnimationEnabled } from "../settings.js";

/**
 * @typedef {import('utils.js').TestOutcome} TestOutcome
 */

const MODULE = {
  SEQUENCER: "sequencer",
  JB2A: "JB2A_DnD5e",
};

const ANIMATION = {
  MISS: "jb2a.ui.miss.white",
  CRITICAL_HIT: "jb2a.ui.critical.red.0",
  CRITICAL_MISS: "jb2a.ui.critical_miss.red.0",
};

/**
 * @param {String} module
 * @returns {Boolean}
 */
const isModuleActive = (module) => (game.modules.get(module)?.active ? true : false);

/**
 * @returns {Boolean}
 */
const isSequencerEnabled = () => isModuleActive(MODULE.SEQUENCER);

/**
 * @returns {Boolean}
 */
const isJB2AEnabled = () => isModuleActive(MODULE.JB2A);

/**
 * @param {String} animation
 * @param {Target} token
 */
const playSimpleAnimationOnToken = (animation, token) => {
  if (isSequencerEnabled() && isJB2AEnabled() && isAttackAnimationEnabled()) {
    new Sequence().effect(animation).atLocation(token).scaleToObject(4).play();
  }
};

/**
 * @param {String} animation
 */
const playAnimationOnTargets = (animation) => {
  for (const target of game.user.targets) {
    playSimpleAnimationOnToken(animation, target);
  }
};

/**
 * @param {String} animation
 */
const playAnimationOnControlledToken = (animation) => {
  const controlledToken = canvas.tokens.controlled[0];
  if (controlledToken) {
    playSimpleAnimationOnToken(animation, controlledToken);
  }
};

export const playAttackMissAnimation = () => playAnimationOnControlledToken(ANIMATION.MISS);
export const playAttackCriticalMissAnimation = () => playAnimationOnControlledToken(ANIMATION.CRITICAL_MISS);
export const playAttackCriticalHitAnimation = () => playAnimationOnControlledToken(ANIMATION.CRITICAL_HIT);
export const playDefenseMissAnimation = () => playAnimationOnControlledToken(ANIMATION.MISS);
export const playDefenseCriticalMissAnimation = () => playAnimationOnControlledToken(ANIMATION.CRITICAL_MISS);
export const playDefenseCriticalHitAnimation = () => playAnimationOnControlledToken(ANIMATION.CRITICAL_HIT);

/**
 * @param {TestOutcome} testOutcome
 */
export const playAttackAnimationForOutcome = (testOutcome) => {
  switch (testOutcome.outcome) {
    case CONFIG.PB.outcome.fumble:
      playAttackCriticalMissAnimation();
      break;
    case CONFIG.PB.outcome.critical_success:
      playAttackCriticalHitAnimation();
      break;
    case CONFIG.PB.outcome.failure:
      playAttackMissAnimation();
      break;
  }
};

/**
 * @param {TestOutcome} testOutcome
 */
export const playDefenseAnimationForOutcome = (testOutcome) => {
  switch (testOutcome.outcome) {
    case CONFIG.PB.outcome.fumble:
      playDefenseCriticalMissAnimation();
      break;
    case CONFIG.PB.outcome.critical_success:
      playDefenseCriticalHitAnimation();
      break;
    case CONFIG.PB.outcome.failure:
      playDefenseMissAnimation();
      break;
  }
};
