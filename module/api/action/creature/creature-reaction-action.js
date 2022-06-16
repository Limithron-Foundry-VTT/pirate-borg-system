import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createReactionOutcome } from "../../outcome/creature/reaction-outcome.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @returns {Promise.<ChatMessage>}
 */
export const creatureReactionAction = async (actor) => {
  const outcome = await createReactionOutcome({ actor });

  return await showGenericCard({
    title: game.i18n.localize("PB.Reaction"),
    actor,
    outcomes: [outcome],
  });
};
