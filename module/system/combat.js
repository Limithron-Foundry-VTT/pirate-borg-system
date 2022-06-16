export class PBCombat extends Combat {
  async setPartyInitiative(rollTotal) {
    game.combat.partyInitiative = rollTotal;
    await game.combat.resortCombatants();
  }

  async resortCombatants() {
    // TODO: this seems like a stupidly-hacky way to do this. Is there no better way?
    const updates = this.turns.map((t) => ({
      _id: t.id,
      initiative: t.data.initiative,
    }));
    await game.combat.resetAll();
    await this.updateEmbeddedDocuments("Combatant", updates);
  }

  isFriendlyCombatant(combatant) {
    if (combatant._token) {
      // v8 compatible
      return combatant._token.data.disposition === 1;
    }
    if (combatant.token) {
      // v9+
      return combatant.token.data.disposition === 1;
    }
    return false;
  }

  /**
   * Define how the array of Combatants is sorted in the displayed list of the tracker.
   * This method can be overridden by a system or module which needs to display combatants in an alternative order.
   * By default sort by initiative, falling back to name
   * @private
   */
  _sortCombatants(a, b) {
    // .combat is a getter, so verify existence of combats array
    if (game.combats && game.combat.partyInitiative) {
      const isPartyA = game.combat.isFriendlyCombatant(a);
      const isPartyB = game.combat.isFriendlyCombatant(b);
      if (isPartyA !== isPartyB) {
        // only matters if they're different
        if (game.combat.partyInitiative > 3) {
          // players begin
          return isPartyA ? -1 : 1;
        }
        // enemies begin
        return isPartyA ? 1 : -1;
      }
    }

    // combatants are both friendly or enemy, so sort by normal initiative
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    const ci = ib - ia;
    if (ci !== 0) return ci;
    const [an, bn] = [a.token?.name || "", b.token?.name || ""];
    const cn = an.localeCompare(bn);
    if (cn !== 0) return cn;
    return a.tokenId - b.tokenId;
  }
}
