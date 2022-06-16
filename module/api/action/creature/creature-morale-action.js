import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createMoraleOutcome } from "../../outcome/creature/morate-outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise.<ChatMessage>}
 */
export const creatureMoraleAction = async (actor) => {
  if (!actor.attributes.morale || actor.attributes.morale === "-") {
    ui.notifications.warn(`Creature don't have a morale value!`);
    return;
  }

  const outcome = await createMoraleOutcome({ actor });

  return await showGenericCard({
    title: game.i18n.localize("PB.Morale"),
    actor,
    outcomes: [outcome],
  });
};
