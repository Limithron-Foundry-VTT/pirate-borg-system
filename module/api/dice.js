/**
 * Show roll in Dice So Nice if it's available.
 * @param {Roll} roll
 * @return {Promise<void>}
 */
export const showDice = async (roll) => {
  if (game.dice3d) {
    // we pass synchronize=true so DSN dice appear on all players' screens
    await game.dice3d.showForRoll(roll, game.user, true, null, false);
  }
};

/**
 * Dice sound to use for ChatMessage. False if Dice So Nice is available.
 * @return {string|null}
 */
export const diceSound = () => {
  if (game.dice3d) {
    return null;
  }
  return CONFIG.sounds.dice;
};

/**
 * Play a die sound if Dice so Nice is not available
 */
export const playDiceSound = () => {
  if (!game.dice3d) {
    const options = {
      src: CONFIG.sounds.dice,
      volume: 0.8,
      autoplay: true,
      loop: false,
    };

    if (game.release.generation >= 12) {
      foundry.audio.AudioHelper.play(options, true);
    } else {
      AudioHelper.play(options, true);
    }
  }
};

/**
 * @param {Roll[]} rolls
 */
export const showDiceWithSound = async (rolls) => {
  const terms = game.release.generation >= 12 ? foundry.dice.terms.PoolTerm.fromRolls(rolls) : PoolTerm.fromRolls(rolls);
  await showDice(Roll.fromTerms([terms]));
  playDiceSound();
};

/**
 * @param {String} targetMessageId
 * @return {Promise<Boolean>}
 */
export const waitForMessageRoll = (targetMessageId) => {
  const createHook = (resolve) => {
    Hooks.once("diceSoNiceRollComplete", (messageId) => {
      if (targetMessageId === messageId) resolve(true);
      else createHook(resolve);
    });
  };
  return new Promise((resolve) => {
    if (game.dice3d) {
      createHook(resolve);
    } else {
      resolve(true);
    }
  });
};
