import { getSystemFlag, setSystemFlag } from "../api/utils.js";

/**
 * @extends Combat
 */
export class PBCombat extends Combat {
  get partyInitiative() {
    return getSystemFlag(this, CONFIG.PB.flags.PARTY_INITIATIVE);
  }

  async updatePartyInitiative(rollTotal) {
    await setSystemFlag(this, CONFIG.PB.flags.PARTY_INITIATIVE, rollTotal);
  }

  async setPartyInitiative(rollTotal) {
    await this.updatePartyInitiative(rollTotal);
    const updates = this.turns.map((t) => ({
      _id: t.id,
      initiative: t.data.initiative,
    }));
    await game.combat.resetAll();
    await this.updateEmbeddedDocuments("Combatant", updates);
  }

  /** @private */
  _sortCombatants(a, b) {
    const combat = a.combat; // game.combats is not initialized at first render
    const isFriendlyA = a.token?.data.disposition === 1 ?? false;
    const isFriendlyB = b.token?.data.disposition === 1 ?? false;
    const isVehicleA = a.actor?.isAnyVehicle ?? false;
    const isVehicleB = b.actor?.isAnyVehicle ?? false;

    // move all vehicle at the top of the tracker
    if (isVehicleA !== isVehicleB) {
      return -1;
    }

    // Split combatants into their own group
    if (combat.partyInitiative && (!isVehicleA || !isVehicleB)) {
      if (isFriendlyA !== isFriendlyB) {
        if (combat.partyInitiative > 3) {
          return isFriendlyA ? -1 : 1;
        }
        return isFriendlyA ? 1 : -1;
      }
    }

    // combatants are both friendly or enemy, so sort by normal initiative
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    const ci = ib - ia;
    if (ci !== 0) return ci;

    // friendly ship goes first when initiative is equal
    if (ci === 0 && isVehicleA && isVehicleB) {
      if (isFriendlyA !== isFriendlyB) {
        return isFriendlyA ? -1 : 1;
      }
      return isFriendlyA ? 1 : -1;
    }

    // Sort by name when initiative is equal
    const [an, bn] = [a.token?.name || "", b.token?.name || ""];
    const cn = an.localeCompare(bn);
    if (cn !== 0) return cn;

    return a.tokenId - b.tokenId;
  }
}
