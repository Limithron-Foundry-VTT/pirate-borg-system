import { normalizeEffectDuration } from "../api/effect-duration.js";

/**
 * Check a "Luck Die Formula" change and reject those whose value isn't a valid roll formula.
 * @param {Array<Object>} [changes]
 * @returns {Boolean} true when the write should be cancelled
 */
const rejectInvalidLuckDie = (changes) => {
  const invalid = changes?.find((change) => change.key === "system.attributes.luck.die" && change.value && !Roll.validate(String(change.value)));
  if (invalid) ui.notifications.warn(game.i18n.format("PB.LuckDieInvalid", { formula: invalid.value }));
  return !!invalid;
};

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
  async _preCreate(data, options, user) {
    if (rejectInvalidLuckDie(this.changes)) return false;
    return super._preCreate(data, options, user);
  }

  /** @override */
  async _preUpdate(changed, options, user) {
    // v13 keeps changes at the top level, v14 under system
    if (rejectInvalidLuckDie(changed.changes ?? changed.system?.changes)) return false;
    return super._preUpdate(changed, options, user);
  }

  /** @override */
  get isSuppressed() {
    const item = this.parent;
    if (!item || item.documentName !== "Item") return false;
    if (!CONFIG.PB.equippableItemTypes.includes(item.type)) return false;
    return !item.equipped;
  }
}
