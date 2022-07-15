import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createSinkingOutcome } from "../../outcome/ship/ship-sinking-outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise.<void>}
 */
export const shipSinkAction = async (actor) => {
  const outcome = await createSinkingOutcome({ actor });

  await showGenericCard({
    title: game.i18n.localize("PB.ShipSinking"),
    description: game.i18n.localize("PB.ShipSinkingMessage"),
    actor,
    outcomes: [outcome],
  });
};
