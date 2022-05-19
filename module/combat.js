import { showGenericWieldCard } from "./chat-message/generic-wield-card.js";
import { evaluateFormula } from "./utils.js";

export const rollPartyInitiative = async () => {
  const initiativeRoll = await evaluateFormula("d6");
  await showGenericWieldCard({
    actor: this,
    title: game.i18n.localize("PB.PartyInitiative"),
    wieldFormula: initiativeRoll.formula,
    wieldRoll: initiativeRoll,
    wieldOutcome: game.i18n.localize(initiativeRoll.total <= 3 ? "PB.InitiativeEnemiesBegin" : "PB.InitiativePlayerCharactersBegin"),
  });

  if (game.combats && game.combat) {
    await game.combat.setPartyInitiative(initiativeRoll.total);
  }
};

export const rollIndividualInitiative = async (actor) => {
  const initiativeRoll = await evaluateFormula("d6+@abilities.agility.value", actor.getRollData());
  await showGenericWieldCard({
    actor: this,
    title: game.i18n.localize("PB.Initiative"),
    wieldFormula: initiativeRoll.formula,
    wieldRoll: initiativeRoll,
  });

  if (game.combats && game.combat) {
    const combatant = actor.token?.combatant ?? game.combat.combatants.find((combatant) => combatant.actor.id === actor.id);
    if (combatant) {
      combatant.update({ initiative: initiativeRoll.total });
    }
  }
};

export class PBCombat extends Combat {
  async setPartyInitiative(rollTotal) {
    game.combat.partyInitiative = rollTotal;
    await game.combat.resortCombatants();
  }

  async resortCombatants() {
    // TODO: this seems like a stupidly-hacky way to do this. Is there no better way?
    const updates = this.turns.map((t) => {
      return {
        _id: t.id,
        initiative: t.data.initiative,
      };
    });
    await game.combat.resetAll();
    await this.updateEmbeddedDocuments("Combatant", updates);
  }

  isFriendlyCombatant(combatant) {
    if (combatant._token) {
      // v8 compatible
      return combatant._token.data.disposition === 1;
    } else if (combatant.token) {
      // v9+
      return combatant.token.data.disposition === 1;
    } else {
      return false;
    }
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
        } else {
          // enemies begin
          return isPartyA ? 1 : -1;
        }
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
