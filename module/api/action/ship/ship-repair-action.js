import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";
import { createRepairOutcome } from "../../outcome/ship/ship-repair-outcome.js";
import { showGenericCard } from "../../../chat-message/generic-card.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} weapon
 * @returns {Promise.<Outcome>}
 */
export const shipRepairAction = async (actor, isPCAction) => {
  const canHeal = actor.attributes.hp.value < actor.attributes.hp.max / 2;

  const { selectedActor, selectedDR } = await showCrewActionDialog({
    actor,
    enableCrewSelection: isPCAction && canHeal,
    enableDrSelection: true && canHeal,
    title: game.i18n.localize("PB.ShipCrewActionRepair"),
    description: game.i18n.localize("PB.ShipRepairMessage"),
    canSubmit: canHeal,
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
