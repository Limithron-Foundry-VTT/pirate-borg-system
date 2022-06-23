import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createInvokeRitualOutcome } from "../../outcome/character/invoke-ritual-outcome.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @returns {Promise.<void>}
 */
export const characterInvokeRitualAction = async (actor, item) => {
  if (actor.rituals.value < 1) {
    ui.notifications.error(`${game.i18n.localize("PB.NoPowerUsesRemaining")}!`);
    return;
  }

  const outcome = await createInvokeRitualOutcome({ actor });

  if (outcome.isSuccess) {
    await actor.updateRituals({ value: Math.max(0, actor.rituals.value - 1) });
  }

  await showGenericCard({
    actor,
    title: item.name,
    description: item.getData().description,
    outcomes: [outcome],
  });

  // await this.useActionMacro(item.id);
};
