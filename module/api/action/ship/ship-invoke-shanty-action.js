import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createInvokeShantyOutcome } from "../../outcome/ship/ship-invoke-shanty-outcome.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @returns {Promise.<void>}
 */
export const shipInvokeShantyAction = async (actor, item) => {
  if (actor.shanties.value < 1) {
    ui.notifications.error(`${game.i18n.localize("PB.ShipNoShantiesUsesRemaining")}!`);
    return;
  }

  const outcome = await createInvokeShantyOutcome({ actor });

  await actor.updateShanties({ value: Math.max(0, actor.shanties.value - 1) });

  await showGenericCard({
    actor,
    title: item.name,
    description: item.getData().description,
    outcomes: [outcome],
  });
  // await this.useActionMacro(item.id);
};
