const { Token } = foundry.canvas.placeables;
const { TokenTurnMarker } = foundry.canvas.placeables.tokens;

/**
 * Gives every token in the acting block a turn marker in side based combat.
 */
export class PBToken extends Token {
  /** @override */
  _refreshTurnMarker() {
    const combat = game.combat;
    if (!combat?.usesSideBasedCombat) return super._refreshTurnMarker();

    // Core's _refreshTurnMarker, with isTurn widened from the current combatant to its block.
    const { turnMarker } = this.document;
    const markersEnabled = CONFIG.Combat.settings.turnMarker.enabled && turnMarker.mode !== CONST.TOKEN_TURN_MARKER_MODES.DISABLED;
    const isTurn = combat.getActiveBlock().some((combatant) => combatant.tokenId === this.id);
    if (markersEnabled && isTurn) {
      if (!this.turnMarker) this.turnMarker = this.addChildAt(new TokenTurnMarker(this), 0);
      canvas.tokens.turnMarkers.add(this);
      this.turnMarker.draw();
    } else if (this.turnMarker) {
      canvas.tokens.turnMarkers.delete(this);
      this.turnMarker.destroy();
      this.turnMarker = null;
    }
  }
}
