import { showGenericCard } from "../../../chat-message/generic-card.js";
import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";

/**
 * @param {PBActor} actor
 * @param {String} title
 * @param {String} description
 * @returns {Promise.<Outcome>}
 */
export const shipBoardingPartyAction = async (actor) => {
  await showCrewActionDialog({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionBoardingParty"),
    description: game.i18n.localize("PB.ShipBoardingPartyMessage"),
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionBoardingParty"),
    description: game.i18n.localize("PB.ShipBoardingPartyMessage"),
  });
};
