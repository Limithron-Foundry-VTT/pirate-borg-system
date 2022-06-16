import { showGenericCard } from "../../../chat-message/generic-card.js";
import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";

/**
 * @param {PBActor} actor
 * @param {String} title
 * @param {String} description
 * @returns {Promise.<Outcome>}
 */
export const shipDropAnchorAction = async (actor) => {
  await showCrewActionDialog({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionDropAnchor"),
    description: game.i18n.localize("PB.ShipDropAnchorMessage"),
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionDropAnchor"),
    description: game.i18n.localize("PB.ShipDropAnchorMessage"),
  });
};
