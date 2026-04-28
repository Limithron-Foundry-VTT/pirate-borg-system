import { PBChatTrayElement } from "./pb-chat-tray-element.js";

/**
 * `<outcome-tray>` wraps a single outcome row inside a generic chat card.
 *
 * The tray inherits collapsible behavior from `PBChatTrayElement` and is
 * registered in `PBChatMessage.TRAY_TYPES`, which is what gives it state
 * persistence across `message.update(...)`. Existing outcome buttons keep
 * working through the legacy `button.item-button` jQuery delegate registered
 * in `module/system/render-chat-message.js`, so this is purely additive.
 */
export class PBOutcomeTray extends PBChatTrayElement {
  static tagName = "outcome-tray";
}

if (typeof customElements !== "undefined" && !customElements.get(PBOutcomeTray.tagName)) {
  customElements.define(PBOutcomeTray.tagName, PBOutcomeTray);
}
