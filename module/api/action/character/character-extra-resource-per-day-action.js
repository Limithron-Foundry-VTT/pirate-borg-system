import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createExtraResourcePerDayOutcome } from "../../outcome/character/extra-resource-per-day-outcome.js";

/**
 * @param {PBActor} actor
 * @param {Object} options
 * @param {Boolean} options.silent
 * @returns {Promise.<Outcome>}
 */
export const characterExtraResourcePerDayAction = async (actor, { silent = false } = {}) => {
  if (!actor.useExtraResource) {
    return;
  }

  const outcome = await createExtraResourcePerDayOutcome({ actor });

  await actor.updateExtraResource({ max: outcome.roll.total, value: outcome.roll.total });

  console.log(actor.extraResourceNamePlural, actor)

  if (!silent) {
    await showGenericCard({
      actor,
      title: `${actor.extraResourceNamePlural} ${game.i18n.localize("PB.PerDay")}`,
      outcomes: [outcome],
    });
  }

  return outcome;
};
