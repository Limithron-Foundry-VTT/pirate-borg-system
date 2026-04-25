/**
 * Base class for collapsible Pirate Borg chat tray elements.
 *
 * Concrete trays extend this class and define a static `tagName`. The
 * accompanying `PBChatMessage` and `PBChatLog` subclasses preserve the `open`
 * attribute across `message.update(...)` re-renders, so subclasses get tray-state
 * persistence for free.
 */
export class PBChatTrayElement extends HTMLElement {
  static get observedAttributes() {
    return ["open", "visible"];
  }

  /**
   * Whether the tray body is currently expanded.
   * @returns {boolean}
   */
  get open() {
    return this.hasAttribute("open");
  }

  set open(value) {
    if (value) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  /**
   * Whether the tray is currently in the chat viewport. The tray element
   * updates this via an IntersectionObserver and subclasses can read it to
   * short-circuit heavy work when offscreen.
   * @returns {boolean}
   */
  get visible() {
    return this.hasAttribute("visible");
  }

  set visible(value) {
    if (value) this.setAttribute("visible", "");
    else this.removeAttribute("visible");
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      this._renderContent();
    }
    this._wireHeader();
    this._attachVisibilityObserver();
  }

  disconnectedCallback() {
    this._unwireHeader();
    this._detachVisibilityObserver();
  }

  /**
   * Subclasses can override to render or augment tray body content. Default is
   * a no-op since most trays are populated server-side via the parent template.
   */
  _renderContent() {}

  /**
   * Wires the default header click to toggle the open state. Skips clicks that
   * originate inside an interactive element so embedded buttons keep working.
   */
  _wireHeader() {
    const header = this.querySelector(".pb-chat-tray-header");
    if (!header) return;
    if (this._headerEl === header && this._onHeaderClick) return;
    this._unwireHeader();
    this._onHeaderClick = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("button, a, input, select, textarea, label")) return;
      this.open = !this.open;
    };
    header.addEventListener("click", this._onHeaderClick);
    this._headerEl = header;
  }

  _unwireHeader() {
    this._headerEl?.removeEventListener("click", this._onHeaderClick);
    this._headerEl = null;
    this._onHeaderClick = null;
  }

  _attachVisibilityObserver() {
    if (typeof IntersectionObserver === "undefined") {
      this.visible = true;
      return;
    }
    if (this._visibilityObserver) return;
    this._visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target !== this) continue;
          this.visible = entry.isIntersecting;
        }
      },
      {
        root: document.querySelector("#chat-log"),
        threshold: 0.01,
      }
    );
    this._visibilityObserver.observe(this);
  }

  _detachVisibilityObserver() {
    this._visibilityObserver?.disconnect();
    this._visibilityObserver = null;
  }

  /**
   * Resolve the chat message that owns this tray by walking up to the
   * `[data-message-id]` ancestor that Foundry adds to every rendered card.
   * @returns {ChatMessage|null}
   */
  get message() {
    const messageId = this.closest("[data-message-id]")?.dataset?.messageId;
    return messageId ? game.messages?.get(messageId) ?? null : null;
  }
}
