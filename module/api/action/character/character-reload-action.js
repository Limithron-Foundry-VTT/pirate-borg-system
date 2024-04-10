import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createReloadingOutcome } from "../../outcome/character/reloading-outcome.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @returns {Promise<Object>}
 */
export const characterReloadAction = async (actor, item) => {
  const reloadTime = item.reloadTime || 1;
  if (!item.needsReloading) {
    return;
  }

  let loadingCount = item.loadingCount || 0;
  loadingCount = Math.max(--loadingCount, 0);

  await item.setLoadingCount(loadingCount);

  const outcome = await createReloadingOutcome({ actor });

  await showGenericCard({
    actor,
    title: game.i18n.format("PB.ReloadingTitle", { item: item.name }),
    description: game.i18n.format("PB.Reloading", {
      current: reloadTime - loadingCount || 1,
      max: reloadTime || 1,
    }),
    outcomes: [outcome],
  });

  return outcome;
};
