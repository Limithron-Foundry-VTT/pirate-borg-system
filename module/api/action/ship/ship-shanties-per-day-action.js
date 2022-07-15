import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createShantiesPerDayOutcome } from "../../outcome/ship/ship-shanties-per-day-outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise.<void>}
 */
export const shipShantiesPerDayAction = async (actor) => {
  const captain = game.actors.get(actor.captain);

  const outcome = await createShantiesPerDayOutcome({ actor: captain });

  await actor.updateShanties({ max: outcome.roll.total, value: outcome.roll.total });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipMysticShanties"),
    outcomes: [outcome],
  });
};
