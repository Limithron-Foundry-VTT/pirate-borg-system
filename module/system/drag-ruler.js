export const onDragRulerReady = (SpeedProvider) => {
  class PirateBorgSpeedProvider extends SpeedProvider {
    get colors() {
      return [
        { id: "stay", default: 0x0000ff, name: "pirateborg.speeds.stay" },
        { id: "walk", default: 0x00ff00, name: "pirateborg.speeds.walk" },
      ];
    }

    getRanges(token) {
      const speed = token.actor.attributes?.speed?.max ?? 0.6;
      return [
        { range: 0, color: "stay" },
        { range: speed * 50, color: "walk" },
      ];
    }
  }
  dragRuler.registerSystem("pirateborg", PirateBorgSpeedProvider);
};
