/**
 * @param {PBActor} actor
 * @param {Number} angle
 */
export const shipRotateAction = async (actor, angle) => {
  const token = actor.token || game.scenes.current.tokens.find((token) => token.actor.id === actor.id);
  if (token) {
    const currentRotation = token.data.rotation;
    await token.update({ rotation: currentRotation + angle });
  }
};
