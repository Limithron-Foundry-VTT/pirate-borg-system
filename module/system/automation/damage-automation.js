import { isAutomaticDamageEnabled } from "../settings.js";

/**
 * @param {PBActor} actor
 * @param {Number} damage
 */
export const applyActorDamage = async (targetActor, damage) => {
  console.log(`${targetActor.name} take ${damage} damages`);
  if (isAutomaticDamageEnabled()) {
    this.setHp({ value: targetActor.hp.value - damage });
  }
};

/**
 * @param {PBActor} actor
 * @param {Number} damage
 */
const inflictActorDamage = async (actor, damage) => {
  for (const target of game.user.targets) {
    if (game.user.isGM) {
      await target.actor.takeActorDamage(actor, damage);
    } else {
      emitDamageOnToken(target.id, actor.id, damage);
    }
  }
};

export const getScalingFactorBetween = (actor, targetActor) => {
  if (targetActor) {
    if (actor.isAnyVehicle() && targetActor.isCharacter()) {
      return "* 5";
    } else if (targetActor.isAnyVehicle() && actor.isCharacter()) {
      return "/ 5";
    }
  }
  return 1;
};

export const getScaledDamageFormula = (source, target, damageFormula) => {
  const scalingFactor = getScalingFactorBetween(source, target);
  return scalingFactor === 1 ? damageFormula : `(${damageFormula}) ${scalingFactor}`;
};

export const scaleDamageBetween = (source, target, damage) => {
  return damage * getScalingFactorBetween(source, target);
};
