import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createInitiativeOutcome } from "../../outcome/actor/initiative-outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise<Object>}
 */
export const actorInitiativeAction = async (actor) => {
  const outcome = await createInitiativeOutcome({ actor });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.Initiative"),
    outcomes: [outcome],
  });

  if (game.combats && game.combat) {
    const combatant = actor.token?.combatant ?? game.combat.combatants.find((combatant) => combatant.actor.id === actor.id);
    if (combatant) {
      combatant.update({ initiative: outcome.roll.total });
    }
  }

  return outcome;
};
