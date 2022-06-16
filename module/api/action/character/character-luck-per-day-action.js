import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createLuckPerDayOutcome } from "../../outcome/character/extra-luck-per-day-outcome.js";

/**
 * @param {PBActor} actor
 * @param {Object} options
 * @param {Boolean} options.silent
 * @returns {Promise.<Outcome>}
 */
export const characterLuckPerDayAction = async (actor, { silent = false } = {}) => {
  if (!actor.getCharacterClass()) {
    return;
  }

  const outcome = await createLuckPerDayOutcome({ actor });

  await actor.updateLuck({ max: outcome.total, value: outcome.total });

  if (!silent) {
    await showGenericCard({
      actor,
      title: game.i18n.localize("PB.Luck"),
      outcomes: [outcome],
    });
  }

  return outcome;
};
