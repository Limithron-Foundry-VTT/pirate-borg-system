import { showGenericCard } from "../../../chat-message/generic-card.js";
import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";
import { createDropAnchorOutcome } from "../../outcome/ship/ship-drop-anchor-outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise.<void>}
 */
export const shipDropAnchorAction = async (actor) => {
  await showCrewActionDialog({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionDropAnchor"),
    description: game.i18n.localize("PB.ShipDropAnchorMessage"),
    buttonLabel: game.i18n.localize("PB.Ok"),
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionDropAnchor"),
    description: game.i18n.localize("PB.ShipDropAnchorMessage"),
    outcomes: [await createDropAnchorOutcome({ actor })],
  });
};
