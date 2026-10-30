import { SIDE } from "./combat-order.js";

/**
 * @extends Combatant
 */
export class PBCombatant extends Combatant {
  /**
   * @override
   */
  _getInitiativeFormula() {
    return this.actor?.system?.abilities?.agility ? "1d6 + @abilities.agility.value" : "1d6";
  }
}

/**
 * @param {Combatant} combatant
 * @returns {import("./combat-order.js").CombatantInfo}
 */
export const toCombatantInfo = (combatant) => {
  const disposition = combatant.token?.disposition ?? combatant.actor?.prototypeToken?.disposition;
  return {
    id: combatant.id,
    name: combatant.token?.name ?? combatant.name ?? "",
    initiative: Number.isFinite(combatant.initiative) ? combatant.initiative : null,
    isShip: !!combatant.actor?.isAnyVehicle,
    side: disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY ? SIDE.PARTY : SIDE.ENEMY,
  };
};
