import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createBrokenOutcome } from "../../outcome/character/broken-outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise<Object>}
 */
export const characterBrokenAction = async (actor) => {
  const outcome = await createBrokenOutcome({ actor });

  await showGenericCard({
    title: game.i18n.localize("PB.Broken"),
    actor,
    outcomes: [outcome],
  });

  return outcome;
};
