/**
 * @callback targetsChangedCallback
 * @param {Array.<Token>} targets
 * @returns {String}
 */

/**
 * @param {targetsChangedCallback} callback
 * @returns {Number}
 */
export const registerTargetAutomationHook = (callback) =>
  Hooks.on("targetToken", (user) => {
    if (user.id === game.user.id) {
      callback(game.user.targets);
    }
  });

/**
 * @param {String} hookId
 */
export const unregisterTargetAutomationHook = (hookId) => Hooks.off("targetToken", hookId);

/**
 * @returns {Array.<Token>}
 */
export const findTargettedToken = () => {
  if (!isTargetSelectionValid()) {
    return null;
  }
  const [target] = game.user.targets;
  return target;
};

/**
 * @returns {Boolean}
 */
export const hasTargets = () => game.user.targets.size > 0;

/**
 * @returns {Boolean}
 */
export const isTargetSelectionValid = () => game.user.targets.size === 1;

/**
 * @param {PBActor} actor
 * @returns {Token}
 */
export const getInitiatorToken = (actor) => actor?.getActiveTokens(true)?.pop() ?? canvas.tokens.controlled[0];
