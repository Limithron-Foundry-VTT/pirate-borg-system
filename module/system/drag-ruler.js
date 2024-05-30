export const onDragRulerReady = (SpeedProvider) => {
  class PirateBorgSpeedProvider extends SpeedProvider {
    get colors() {
      return [
        { id: "stay", default: 0x0000ff, name: "PB.SpeedsStay" },
        { id: "move", default: 0x00ff00, name: "PB.SpeedsMove" },
      ];
    }

    getRanges(token) {
      // Most creatures can travel 30' (or six 5-foot squares) a round.
      // Ships play on a 50' hex grid and can move their speed in hexes.
      const speed = token.actor.attributes?.speed?.max ?? 6;
      const gridScale = ["vehicle", "vehicle_npc"].includes(token.actor.type) ? 50 : 5;
      return [
        { range: 0, color: "stay" },
        { range: speed * gridScale, color: "move" },
      ];
    }
  }
  dragRuler.registerSystem("pirateborg", PirateBorgSpeedProvider);
};
