/**
 * Chat interaction domains currently active in Pirate Borg.
 *
 * `kind: "tray"` domains define custom-element tray tags that participate in
 * tray open-state persistence. Non-tray domains are documented here so all
 * current chat interactivity is represented in one registry.
 */
export const CHAT_DOMAIN_REGISTRY = Object.freeze({
  outcomeTray: {
    id: "outcome-tray",
    kind: "tray",
    tagName: "outcome-tray",
    identityAttribute: "data-outcome-id",
  },
  outcomeButtons: {
    id: "outcome-buttons",
    kind: "legacy-hook",
    note: "Handled by render-chat-message button delegation and outcome handlers.",
  },
  outcomeAutomation: {
    id: "outcome-automation",
    kind: "legacy-hook",
    note: "Handled by render-chat-message automation hook (GM-only).",
  },
  gmOnlySanitization: {
    id: "gm-only-sanitization",
    kind: "post-render",
    note: "Removes gm-only class after render for owner-visible cards.",
  },
  enricherActions: {
    id: "enricher-actions",
    kind: "document-delegate",
    note: "Handled by global enricher click delegation in system/enrichers.js.",
  },
});

/**
 * @returns {string[]}
 */
export const getTrayTagNames = () =>
  Object.values(CHAT_DOMAIN_REGISTRY)
    .filter((domain) => domain.kind === "tray")
    .map((domain) => domain.tagName);
