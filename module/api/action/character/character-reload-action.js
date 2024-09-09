import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createReloadingOutcome } from "../../outcome/character/reloading-outcome.js";
import { trackAmmo } from "../../../system/settings.js";

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

  if (item.usesAmmo && item.ammoId && trackAmmo()) {
    const ammo = actor.items.get(item.ammoId);
    if (!ammo?.quantity) {
      const decision = await Dialog.confirm({
        title: game.i18n.localize("PB.OutOfAmmoTitle"),
        content: `<p>${game.i18n.localize("PB.OutOfAmmo")}</p>`,
      });

      if (!decision) {
        return;
      }

      await showGenericCard({
        actor,
        title: game.i18n.localize("PB.OutOfAmmoTitle"),
        description: game.i18n.format("PB.OutOfAmmoReloaded", {
          item: item.name,
        }),
      });
    }
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
