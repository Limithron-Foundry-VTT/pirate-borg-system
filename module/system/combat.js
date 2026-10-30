import { getSystemFlag } from "../api/utils.js";
import { actorPartyInitiativeAction } from "../api/action/actor/actor-party-initiative-action.js";
import { createChatMessageWithVisibility, getOtherChatMessageStyle } from "../chat-message/chat-message-visibility.js";
import { KIND, compareCombatants, getBlockRange, getCombatKind, getNextBlockStart, getPreviousBlockStart, usesSideBasedCombat } from "./combat-order.js";
import { toCombatantInfo } from "./combatant.js";
import { getInitiativeMode, isAutoExpireEffectsEnabled, isRerollInitiativeEachRoundEnabled } from "./settings.js";

/** Effect UUIDs currently being expired, so overlapping turn events don't expire one twice. */
const expiringEffects = new Set();

/**
 * @extends Combat
 */
export class PBCombat extends Combat {
  get partyInitiative() {
    return getSystemFlag(this, CONFIG.PB.flags.PARTY_INITIATIVE);
  }

  /** @returns {String} KIND.SHIP when any combatant is a ship, otherwise KIND.CREW */
  get kind() {
    return getCombatKind(this.combatants.map(toCombatantInfo));
  }

  /** @returns {Boolean} Whether crew act as two blocks (side based combat) */
  get usesSideBasedCombat() {
    return usesSideBasedCombat(this.kind, getInitiativeMode());
  }

  /**
   * @param {Combatant} combatant
   * @returns {Combatant[]} The combatants in the same block as combatant
   */
  getBlockMembers(combatant) {
    const index = this.turns.indexOf(combatant);
    if (!this.usesSideBasedCombat || index < 0) return [combatant];
    const { start, end } = getBlockRange(this.turns.map(toCombatantInfo), index);
    return this.turns.slice(start, end + 1);
  }

  /** @returns {Combatant[]} The combatants whose turn it is */
  getActiveBlock() {
    return this.combatant ? this.getBlockMembers(this.combatant) : [];
  }

  /**
   * In side based combat Roll All rolls the party d6.
   * @override
   */
  async rollAll(options) {
    if (!this.usesSideBasedCombat) return super.rollAll(options);
    await actorPartyInitiativeAction(this);
    return this;
  }

  /**
   * In side based combat Roll NPCs rolls the party d6.
   * @override
   */
  async rollNPC(options = {}) {
    if (!this.usesSideBasedCombat) return super.rollNPC(options);
    await actorPartyInitiativeAction(this);
    return this;
  }

  /**
   * In side based combat crew don't roll individual initiative.
   * @override
   */
  async rollInitiative(ids, options = {}) {
    if (this.usesSideBasedCombat) return this;
    return super.rollInitiative(ids, options);
  }

  /* -------------------------------------------- */
  /*  Turn Lifecycle Hooks                        */
  /* -------------------------------------------- */

  /**
   * Called on the designated GM's client when a turn starts.
   * @inheritDoc
   */
  async _onStartTurn(combatant, context) {
    await super._onStartTurn(combatant, context);
    // Core also calls this for turns it skipped over. In side based combat that would re-run the _expireEffectsForCombatant block.
    if (context?.skipped) return;
    await this._startTurnFor(combatant);
  }

  /** @param {Combatant} combatant */
  async _startTurnFor(combatant) {
    if (!game.user.isGM || !isAutoExpireEffectsEnabled()) return;
    for (const member of this.getBlockMembers(combatant)) await this._expireEffectsForCombatant(member);
  }

  /**
   * Called on the designated GM's client when a round starts.
   * Ships always re-roll. Players follow the re-roll setting.
   * @inheritDoc
   */
  async _onStartRound(context) {
    await super._onStartRound(context);
    if (context.round <= 1) return;
    if (this.kind === KIND.SHIP) return this.rerollAll();
    if (!isRerollInitiativeEachRoundEnabled()) return;
    if (this.usesSideBasedCombat) return actorPartyInitiativeAction(this, { restartRound: true });
    return this.rerollAll();
  }

  /** Reset and re-roll everyone, then start the round with the new first combatant. */
  async rerollAll() {
    const first = this.combatant;
    await this.resetAll({ updateTurn: false });
    await this.rollAll({ updateTurn: false });
    if (this.turn !== 0) await this.update({ turn: 0 }, { turnEvents: false });
    // Core already ran turn-start for the pre-re-roll first combatant.
    if (this.combatant && this.combatant !== first) await this._startTurnFor(this.combatant);
  }

  /** @override */
  async startCombat() {
    await super.startCombat();
    if (this.usesSideBasedCombat && !this.partyInitiative) await actorPartyInitiativeAction(this, { restartRound: true });
    return this;
  }

  /** @override */
  async nextTurn() {
    if (!this.usesSideBasedCombat || this.round === 0) return super.nextTurn();
    const next = getNextBlockStart(this.turns.map(toCombatantInfo), this.turn);
    if (next === null) return this.nextRound();
    return this.#updateTurn(next, 1);
  }

  /** @override */
  async previousTurn() {
    if (!this.usesSideBasedCombat || this.round === 0) return super.previousTurn();
    const previous = getPreviousBlockStart(this.turns.map(toCombatantInfo), this.turn);
    if (previous === null) return this.previousRound();
    return this.#updateTurn(previous, -1);
  }

  /** Mirrors core nextTurn/previousTurn's update so hooks and world time behave the same. */
  async #updateTurn(turn, direction) {
    const updateData = { round: this.round, turn };
    const updateOptions = { direction, worldTime: { delta: this.getTimeDelta(this.round, this.turn, this.round, turn) } };
    Hooks.callAll("combatTurn", this, updateData, updateOptions);
    await this.update(updateData, updateOptions);
    return this;
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
    const expiredEffects = actor.effects.filter((effect) => {
      // Only check temporary effects with duration tracking
      if (!effect.isTemporary) return false;

      // Check if the effect has duration remaining set and is expired.
      // v14 caches duration until its own roundStart/turnStart refresh, which runs after our round/turn hooks.
      const remaining = (game.release.generation >= 14 ? effect.updateDuration() : effect.duration).remaining;
      return remaining !== null && remaining !== undefined && remaining <= 0;
    });

    if (expiredEffects.length === 0) return;

    // Delete expired effects and notify
    for (const effect of expiredEffects) {
      if (expiringEffects.has(effect.uuid) || !actor.effects.has(effect.id)) continue;
      expiringEffects.add(effect.uuid);
      // v14 tracks expiry itself and would try to mark this effect expired after we delete it.
      ActiveEffect.registry?.delete(effect);
      const effectName = effect.name || effect.label || game.i18n.localize("PB.EffectsUnnamed");

      // Post chat notification about the expired effect
      await createChatMessageWithVisibility({
        content: game.i18n.format("PB.EffectExpired", {
          effect: effectName,
          actor: actor.name,
        }),
        speaker: ChatMessage.getSpeaker({ actor }),
        style: getOtherChatMessageStyle(),
      });

      // Delete the effect
      try {
        await effect.delete();
      } finally {
        expiringEffects.delete(effect.uuid);
      }
      console.log(`Pirate Borg | Expired effect "${effectName}" on ${actor.name}`);
    }
  }

  /**
   * @param {Number} rollTotal
   * @param {Object} [options]
   * @param {Boolean} [options.restartRound=false] - Start the round from the new first block (combat start, round-start re-roll).
   */
  async setPartyInitiative(rollTotal, { restartRound = false } = {}) {
    const current = this.combatant;
    await this.update({ [`flags.${CONFIG.PB.flagScope}.${CONFIG.PB.flags.PARTY_INITIATIVE}`]: rollTotal });
    if (!this.started) return;
    const turn = restartRound || !current ? 0 : this.turns.indexOf(this.getBlockMembers(current)[0]);
    if (turn !== this.turn) await this.update({ turn }, { turnEvents: false });
    if (restartRound && this.combatant) await this._startTurnFor(this.combatant);
  }

  /** Re-sort when the party roll changes. */
  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    if (!foundry.utils.hasProperty(changed, `flags.${CONFIG.PB.flagScope}.${CONFIG.PB.flags.PARTY_INITIATIVE}`)) return;
    this.setupTurns();
    this._updateTurnMarkers();
  }

  /** @private */
  _sortCombatants(a, b) {
    const combat = a.combat; // game.combats is not initialized at first render
    return compareCombatants(toCombatantInfo(a), toCombatantInfo(b), {
      kind: combat.kind,
      mode: getInitiativeMode(),
      partyInitiative: combat.partyInitiative,
    });
  }
}
