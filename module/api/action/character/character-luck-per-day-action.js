import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createLuckPerDayOutcome } from "../../outcome/character/luck-per-day-outcome.js";

/**
 * @param {PBActor} actor
 * @param {Object} options
 * @param {Boolean} options.silent
 * @returns {Promise<Object>}
 */
export const characterLuckPerDayAction = async (actor, { silent = false } = {}) => {
  const outcome = await createLuckPerDayOutcome({ actor });

  await actor.updateLuck({ value: outcome.roll.total });

  if (!silent) {
    await showGenericCard({
      actor,
      title: game.i18n.localize("PB.Luck"),
      outcomes: [outcome],
    });
  }

  return outcome;
};
