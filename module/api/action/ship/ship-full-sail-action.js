import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";
import { createFullSailOutcome } from "../../outcome/ship/ship-full-sail-outcome.js";
import { showGenericCard } from "../../../chat-message/generic-card.js";

/**
 * @param {PBActor} actor
 * @param {Boolean} isPCAction
 * @returns {Promise<Object>}
 */
export const shipFullSailAction = async (actor, isPCAction) => {
  const { selectedActor, selectedDR } = await showCrewActionDialog({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionFullSail"),
    description: game.i18n.localize("PB.ShipFullSailMessage"),
    enableCrewSelection: isPCAction,
    enableDrSelection: true,
  });

  const outcome = await createFullSailOutcome({
    actor,
    crew: selectedActor,
    dr: selectedDR,
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionFullSail"),
    description: game.i18n.localize("PB.ShipFullSailMessage"),
    outcomes: [outcome],
  });

  return outcome;
};
