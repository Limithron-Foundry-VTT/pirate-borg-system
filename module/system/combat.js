import { getCombatantInitiative, getSystemFlag, getTokenDisposition, setSystemFlag } from "../api/utils.js";
import { isAutoExpireEffectsEnabled } from "./settings.js";

/**
 * @extends Combat
 */
export class PBCombat extends Combat {
  get partyInitiative() {
    return getSystemFlag(this, CONFIG.PB.flags.PARTY_INITIATIVE);
  }

  /* -------------------------------------------- */
  /*  Turn Lifecycle Hooks                        */
  /* -------------------------------------------- */

  /**
   * Called when a combatant's turn starts.
   * Handles automatic expiration of temporary effects.
   * @param {Combatant} combatant - The combatant whose turn is starting
   * @inheritDoc
   */
  async _onStartTurn(combatant) {
    await super._onStartTurn(combatant);
    
    // Only GM should handle effect expiration to prevent duplicate processing
    if (game.user.isGM && isAutoExpireEffectsEnabled()) {
      await this._expireEffectsForCombatant(combatant);
    }
  }

  /**
   * Called when a combatant's turn ends.
   * @param {Combatant} combatant - The combatant whose turn is ending
   * @inheritDoc
   */
  async _onEndTurn(combatant) {
    await super._onEndTurn(combatant);
  }

  /**
   * Check and expire temporary effects for a combatant's actor.
   * Effects expire when their duration.remaining reaches 0 or below.
   * @param {Combatant} combatant - The combatant to check effects for
   * @private
   */
  async _expireEffectsForCombatant(combatant) {
    const actor = combatant.actor;
    if (!actor) return;

    // Find all temporary effects that have expired
    const expiredEffects = actor.effects.filter(effect => {
      // Only check temporary effects with duration tracking
      if (!effect.isTemporary) return false;
      
      // Check if the effect has duration remaining set and is expired
      const remaining = effect.duration.remaining;
      return remaining !== null && remaining !== undefined && remaining <= 0;
    });

    if (expiredEffects.length === 0) return;

    // Delete expired effects and notify
    for (const effect of expiredEffects) {
      const effectName = effect.name || effect.label || game.i18n.localize("PB.EffectsUnnamed");
      
      // Post chat notification about the expired effect
      await ChatMessage.create({
        content: game.i18n.format("PB.EffectExpired", {
          effect: effectName,
          actor: actor.name
        }),
        speaker: ChatMessage.getSpeaker({ actor }),
        type: CONST.CHAT_MESSAGE_STYLES?.OTHER ?? CONST.CHAT_MESSAGE_TYPES?.OTHER ?? 0
      });

      // Delete the effect
      await effect.delete();
      console.log(`Pirate Borg | Expired effect "${effectName}" on ${actor.name}`);
    }
  }

  async updatePartyInitiative(rollTotal) {
    await setSystemFlag(this, CONFIG.PB.flags.PARTY_INITIATIVE, rollTotal);
  }

  async setPartyInitiative(rollTotal) {
    await this.updatePartyInitiative(rollTotal);
    const updates = this.turns.map((t) => ({
      _id: t.id,
      initiative: getCombatantInitiative(t),
    }));
    await game.combat.resetAll();
    await this.updateEmbeddedDocuments("Combatant", updates);
  }

  /** @private */
  _sortCombatants(a, b) {
    const combat = a.combat; // game.combats is not initialized at first render
    const isFriendlyA = (a.token && getTokenDisposition(a.token)) === 1 ?? false;
    const isFriendlyB = (b.token && getTokenDisposition(b.token)) === 1 ?? false;
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
