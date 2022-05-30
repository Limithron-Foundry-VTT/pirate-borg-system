/**
 * @callback targetChangedCallback
 * @param {Array.<Token>} targets
 */

/**
 * @returns {Boolean}
 */
 export const hasTargets = () => game.user.targets.size > 0;

/**
 * @returns {Boolean}
 */
export const isTargetSelectionValid = () => game.user.targets.size === 1;

/**
 * @returns {Array.<Token>}
 */
export const findTargettedToken = () => {
  if (!isTargetSelectionValid()) { return null; }
  const [first] = game.user.targets;
  return first;
}

/**
 * @param {targetChangedCallback} callback 
 * @returns {Number}
 */
export const registerTargetAutomationHook = (callback) => {
  return Hooks.on("targetToken", (user) => {
    if (user.id === game.user.id) {
      callback(game.user.targets);
    }
  });
}

/**
 * @param {targetChangedCallback} callback 
 */
export const unregisterTargetAutomationHook = (hookId) => Hooks.off("targetToken", hookId);
