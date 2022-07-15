import { isAdvancedAnimationEnabled, isFloatingDamageAnimationEnabled, isFloatingOutcomeAnimationEnabled } from "../../system/settings.js";

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
 * @param {Array.<String>} tokenIds
 * @param {Function} fn
 * @returns
 */
export const playAdvancedAnimation = async (tokenIds = [], fn) => {
  if (!isAdvancedAnimationSupported()) {
    return;
  }

  const tokens = tokenIds.map((tokenId) => canvas.tokens.get(tokenId));
  if (!tokens.every((token) => !!token)) {
    return;
  }

  await fn(...tokens);
};

export const playFloatingAnimation = async (tokenId, text, styles = {}) => {
  const token = canvas.tokens.get(tokenId);
  if (!token) {
    return;
  }

  await token.hud.createScrollingText(text, {
    anchor: CONST.TEXT_ANCHOR_POINTS.TOP,
    fill: "#FFFFFF",
    stroke: "#000000",
    fontSize: 48,
    fontFamily: CONFIG.PB.scrollingTextFont,
    fontWeight: 600,
    duration: 1500,
    strokeThickness: 1,
    jitter: 0,
    ...styles,
  });
};

export const playFloatingDamageAnimation = async (tokenId, text, styles = {}) => {
  if (!isFloatingOutcomeAnimationEnabled()) {
    return;
  }
  await playFloatingAnimation(tokenId, text, styles);
};

export const playFloatingOutcomeAnimation = async (tokenId, text, styles = {}) => {
  if (!isFloatingDamageAnimationEnabled()) {
    return;
  }
  await playFloatingAnimation(tokenId, text, styles);
};
