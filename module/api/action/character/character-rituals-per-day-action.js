import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createRitualPerDayOutcome } from "../../outcome/character/ritual-per-day-outcome.js";

/**
 * @param {PBActor} actor
 * @param {Object} options
 * @param {Boolean} options.silent
 * @returns {Promise.<Object>}
 */
export const characterRitualsPerDayAction = async (actor, { silent = false } = {}) => {
  const outcome = await createRitualPerDayOutcome({ actor });

  await actor.updateRituals({ max: outcome.roll.total, value: outcome.roll.total });

  if (!silent) {
    await showGenericCard({
      actor,
      title: `${game.i18n.localize("PB.RitualRemaining")} ${game.i18n.localize("PB.PerDay")}`,
      outcomes: [outcome],
    });
  }

  return outcome;
};
