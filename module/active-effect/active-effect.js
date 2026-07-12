import { normalizeEffectDuration } from "../api/effect-duration.js";

/**
 * @extends {ActiveEffect}
 */
export class PBActiveEffect extends ActiveEffect {
  /** @override */
  static async createDocuments(data, context = {}) {
    for (const d of data) {
      if (!d) continue;
      d.duration = normalizeEffectDuration(d.duration);
    }
    return super.createDocuments(data, context);
  }
}
