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
