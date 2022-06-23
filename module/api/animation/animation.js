import { isAdvancedAnimationEnabled, isOutcomeAnimationEnabled } from "../../system/settings.js";

const MODULE = {
  SEQUENCER: "sequencer",
  JB2A: "JB2A_DnD5e",
  JB2A_PATREON: "JB2A_patreon",
};

/**
 * @param {String} module
 * @returns {Boolean}
 */
export const isModuleActive = (module) => !!game.modules.get(module)?.active;

/**
 * @returns {Boolean}
 */
export const isSequencerEnabled = () => isModuleActive(MODULE.SEQUENCER);

/**
 * @returns {Boolean}
 */
export const isJB2AEnabled = () => isModuleActive(MODULE.JB2A);

/**
 * @returns {Boolean}
 */
export const isJB2APatreonEnabled = () => isModuleActive(MODULE.JB2A_PATREON);

/**
 * @returns {Boolean}
 */
export const isAdvancedAnimationSupported = () => isSequencerEnabled() && isAdvancedAnimationEnabled() && (isJB2AEnabled() || isJB2APatreonEnabled());

/**
 * @returns {Boolean}
 */
export const isOutcomeAnimationSupported = () => isSequencerEnabled() && isOutcomeAnimationEnabled();

/**
 * @param {Array.<String>} tokenIds
 * @param {Function} fn
 * @returns
 */

export const playAdvancedAnimation = async (tokenIds = [], fn) => {
  if (!isAdvancedAnimationSupported()) {
    return;
  }

  const tokens = tokenIds.map((tokenId) => canvas.tokens.get(tokenId));
  if (!tokens.some((token) => !!token)) {
    return;
  }

  await fn(...tokens);
};


export const playOutcomeAnimation = async (tokenId, animation) => {
  if (!isOutcomeAnimationSupported()) {
    return;
  }

  const token = canvas.tokens.get(tokenId);
  if (!token) {
    return;
  }

  new Sequence()
    .effect(animation)
    .atLocation(token)
    .anchor({ x: 0.5, y: 1.3 })
    .duration(3000)
    .noLoop(true)
    //
    .play();
};
