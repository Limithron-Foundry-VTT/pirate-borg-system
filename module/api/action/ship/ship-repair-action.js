import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";
import { createRepairOutcome } from "../../outcome/ship/ship-repair-outcome.js";
import { showGenericCard } from "../../../chat-message/generic-card.js";

/**
 * @param {PBActor} actor
 * @param {Boolean} isPCAction
 * @returns {Promise<Object>}
 */
export const shipRepairAction = async (actor, isPCAction) => {
  const { selectedActor, selectedDR } = await showCrewActionDialog({
    actor,
    enableCrewSelection: isPCAction,
    enableDrSelection: true,
    title: game.i18n.localize("PB.ShipCrewActionRepair"),
    description: game.i18n.localize("PB.ShipRepairMessage"),
  });

  const outcome = await createRepairOutcome({
    actor,
    crew: selectedActor,
    dr: selectedDR,
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionRepair"),
    description: game.i18n.localize("PB.ShipRepairMessage"),
    outcomes: [outcome],
  });

  return outcome;
};
