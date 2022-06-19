import { showGenericCard } from "../../../chat-message/generic-card.js";
import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";
import { createWeighAnchorOutcome } from "../../outcome/ship/ship-weigh-anchor-outcome.js";

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
    buttonLabel: game.i18n.localize("PB.Ok"),
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionWeighAnchor"),
    description: game.i18n.localize("PB.ShipWeighAnchorMessage"),
    outcomes: [await createWeighAnchorOutcome({ actor })]
  });
};
