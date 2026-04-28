import { PBChatMessage } from "./pb-chat-message.js";

/**
 * Pirate Borg ChatLog subclass.
 *
 * Snapshots the open state of every registered tray element on a message right
 * before its DOM is replaced by `super.updateMessage(...)`. The snapshot lives
 * on `message._trayStates` and is consumed by `PBChatMessage._collapseTrays` on
 * the next `renderHTML` pass, restoring tray UI without losing user state.
 */
export class PBChatLog extends foundry.applications.sidebar.tabs.ChatLog {
  /** @inheritdoc */
  async updateMessage(message, notify = false) {
    try {
      this._snapshotTrayStates(message);
    } catch (error) {
      console.error("Pirate Borg | Failed to snapshot chat tray state", error);
    }
    return super.updateMessage(message, notify);
  }

  /**
   * Capture the `open` attribute of every tray element belonging to the given
   * message into `message._trayStates`.
   * @param {ChatMessage} message
   * @protected
   */
  _snapshotTrayStates(message) {
    const root = this.element?.querySelector?.(`.message[data-message-id="${message.id}"]`);
    if (!root) return;
    const types = message.constructor?.TRAY_TYPES ?? PBChatMessage.TRAY_TYPES ?? [];
    if (!types.length) return;
    const states = new Map();
    for (const tray of root.querySelectorAll(types.join(", "))) {
      states.set(this._getTrayStateKey(tray), tray.hasAttribute("open"));
    }
    message._trayStates = states;
  }

  /**
   * Mirror of `PBChatMessage._getTrayStateKey` so the snapshot keys line up
   * with the keys used during restore.
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
