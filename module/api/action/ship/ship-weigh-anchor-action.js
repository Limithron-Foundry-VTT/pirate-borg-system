import { showGenericCard } from "../../../chat-message/generic-card.js";
import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";

/**
 * @param {PBActor} actor
 * @param {String} title
 * @param {String} description
 * @returns {Promise.<Outcome>}
 */
export const shipWeighAnchorAction = async (actor) => {
  await showCrewActionDialog({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionWeighAnchor"),
    description: game.i18n.localize("PB.ShipWeighAnchorMessage"),
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionWeighAnchor"),
    description: game.i18n.localize("PB.ShipWeighAnchorMessage"),
  });
};
