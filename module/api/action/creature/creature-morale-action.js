import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createMoraleOutcome } from "../../outcome/creature/morale-outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise<Object>}
 */
export const creatureMoraleAction = async (actor) => {
  if (!actor.attributes.morale || actor.attributes.morale === "-") {
    ui.notifications.warn(`Creature don't have a morale value!`);
    return;
  }

  const outcome = await createMoraleOutcome({ actor });

  await showGenericCard({
    title: game.i18n.localize("PB.Morale"),
    actor,
    outcomes: [outcome],
  });

  return outcome;
};
