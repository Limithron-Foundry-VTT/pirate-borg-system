import { showGenericCard } from "../../../chat-message/generic-card.js";
import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";
import { createComeAboutOutcome } from "../../outcome/ship/ship-come-about-outcome.js";

/**
 * @param {PBActor} actor
 * @param {Boolean} isPCAction
 * @returns {Promise<Object>}
 */
export const shipComeAboutAction = async (actor, isPCAction) => {
  const { selectedActor, selectedDR } = await showCrewActionDialog({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionComeAbout"),
    description: game.i18n.localize("PB.ShipComeAboutMessage"),
    enableCrewSelection: isPCAction,
    enableDrSelection: true,
  });

  const outcome = await createComeAboutOutcome({
    actor,
    crew: selectedActor,
    dr: selectedDR,
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionComeAbout"),
    description: game.i18n.localize("PB.ShipComeAboutMessage"),
    outcomes: [outcome],
  });

  return outcome;
};
