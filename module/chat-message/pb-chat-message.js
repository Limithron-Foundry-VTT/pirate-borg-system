import { getTrayTagNames } from "./renderers/chat-domain-registry.js";

/**
 * Pirate Borg ChatMessage subclass.
 *
 * Provides the system's hook for stateful, re-renderable chat UI by exposing
 * `TRAY_TYPES` (custom elements whose `[open]` attribute should survive
 * `message.update(...)` round-trips) and a `_collapseTrays(html)` pass that
 * restores their state from `this._trayStates`. The companion `PBChatLog`
 * snapshots the state into `_trayStates` immediately before delegating to the
 * core chat log update path.
 */
export class PBChatMessage extends ChatMessage {
  /**
   * Tag names of custom tray elements managed by Pirate Borg. Subclasses /
   * future trays should extend this list (e.g. `mishap-tray`, `loot-tray`).
   * @type {string[]}
   */
  static TRAY_TYPES = getTrayTagNames();

  /** @inheritdoc */
  async renderHTML(options = {}) {
    const html = await super.renderHTML(options);
    try {
      this._collapseTrays(html);
      Hooks.callAll("pirateborg.renderChatMessage", this, html);
    } catch (error) {
      console.error("Pirate Borg | Error during chat message render hook", error);
    }
    return html;
  }

  /**
   * Restore the open state of any registered tray elements from `_trayStates`.
   * Trays without a recorded state default to open so first-time renders match
   * the template `open` attribute.
   * @param {HTMLElement} html
   * @protected
   */
  _collapseTrays(html) {
    if (!html?.querySelectorAll) return;
    const selector = this.constructor.TRAY_TYPES.join(", ");
    if (!selector) return;
    for (const tray of html.querySelectorAll(selector)) {
      const stateKey = this._getTrayStateKey(tray);
      const recorded = this._trayStates?.get(stateKey);
      if (recorded === undefined) continue;
      tray.toggleAttribute("open", recorded);
    }
  }

  /**
   * Build a stable identifier for a tray within a message. We prefer
   * `data-tray-id` (explicit), then `data-outcome-id` (outcome trays), then
   * fall back to `tagName + nth-child` for unkeyed trays.
   * @param {HTMLElement} tray
   * @returns {string}
   * @protected
   */
  _getTrayStateKey(tray) {
    const explicit = tray.dataset?.trayId;
    if (explicit) return `${tray.tagName}:${explicit}`;
    const outcome = tray.dataset?.outcomeId ?? tray.dataset?.outcome;
    if (outcome) return `${tray.tagName}:outcome:${outcome}`;
    const siblings = Array.from(tray.parentElement?.children ?? []);
    const index = siblings.indexOf(tray);
    return `${tray.tagName}:index:${index}`;
  }
}
