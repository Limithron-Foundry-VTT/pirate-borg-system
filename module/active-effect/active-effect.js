import { normalizeEffectDuration } from "../api/effect-duration.js";

/**
 * @extends {ActiveEffect}
 */
export class PBActiveEffect extends ActiveEffect {
  /** @override */
  static async createDocuments(data, context = {}) {
    const parent = context.parent;
    for (const d of data) {
      if (!d) continue;
      d.duration = normalizeEffectDuration(d.duration);
      if (parent?.documentName === "Item" && d.transfer === undefined) {
        d.transfer = true;
      }
    }
    return super.createDocuments(data, context);
  }

  /** @override */
  get isSuppressed() {
    const item = this.parent;
    if (!item || item.documentName !== "Item") return false;
    if (!CONFIG.PB.equippableItemTypes.includes(item.type)) return false;
    return !item.equipped;
  }
}
