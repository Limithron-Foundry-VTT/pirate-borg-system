/**
 * Wrapper to register Token Ruler for Foundry v13 in a way that does not break v12 support.
 *
 * TODO:
 * - Refactor after v12 support is removed
 */
export function registerTokenRuler() {
  if (!(game.release.generation >= 13)) return;

  class TokenRulerPB extends foundry.canvas.placeables.tokens.TokenRuler {
    static STYLES = {
      stay: {color: 0x0000ff, alpha: 0.6},
      move: {color: 0x00ff00},
      exceed: {color: 0x990000},
    };

    /** @override */
    _getGridHighlightStyle(waypoint, offset) {
      const style = super._getGridHighlightStyle(waypoint, offset);
      if (!this.token.actor) return style;

      // Most creatures can travel 30' (or six 5-foot squares) a round.
      // Ships play on a 50' hex grid and can move their speed in hexes.
      // v13 tells us how many spaces the token is moving which makes it very straightforward.
      const speed = this.token.actor.effectiveSpeed ?? this.token.actor.attributes?.speed?.max ?? 6;
      const spaces = waypoint.measurement.spaces;

      if (spaces === 0) return this.constructor.STYLES.stay;
      if (spaces > speed) return this.constructor.STYLES.exceed;

      return foundry.utils.mergeObject(style, this.constructor.STYLES.move);
    }
  }

  CONFIG.Token.rulerClass = TokenRulerPB;
}