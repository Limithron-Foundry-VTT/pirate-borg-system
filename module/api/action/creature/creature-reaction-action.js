import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createReactionOutcome } from "../../outcome/creature/reaction-outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise<Object>}
 */
export const creatureReactionAction = async (actor) => {
  const outcome = await createReactionOutcome();

  await showGenericCard({
    title: game.i18n.localize("PB.Reaction"),
    actor,
    outcomes: [outcome],
  });

  return outcome;
};
