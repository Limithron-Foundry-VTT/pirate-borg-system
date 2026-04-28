import { decorateCritFumbleOutcomes } from "./decorate-crit-fumble.js";

const postRenderDecorators = [decorateCritFumbleOutcomes];

/**
 * Register Pirate Borg post-render chat decorators.
 *
 * This hook runs from PBChatMessage.renderHTML and is the canonical place for
 * message-local DOM mutations after the card has been rendered.
 */
export const registerChatRenderers = () => {
  Hooks.on("pirateborg.renderChatMessage", (message, html) => {
    if (!html?.querySelectorAll) return;

    // Preserve historical behavior: owner-visible content should not retain
    // the gm-only class marker once rendered for the current user.
    html.querySelectorAll(".gm-only").forEach((node) => node.classList.remove("gm-only"));

    for (const decorator of postRenderDecorators) {
      decorator(message, html);
    }
  });
};
