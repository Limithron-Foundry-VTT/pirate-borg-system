import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";
import { createBroadsidesOutcome } from "../../outcome/ship/ship-broadsides-outcome.js";
import { showGenericCard } from "../../../chat-message/generic-card.js";

/**
 * @param {PBActor} actor
 * @param {Boolean} isPCAction
 * @returns {Promise.<void>}
 */
export const shipBroadsidesAction = async (actor, isPCAction) => {
  const { selectedActor, selectedDR, selectedArmor, targetToken } = await showCrewActionDialog({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionBroadsides"),
    description: game.i18n.localize("PB.ShipBroadsidesMessage"),
    enableCrewSelection: isPCAction,
    enableDrSelection: true,
    enableArmorSelection: true,
    enableTargetSelection: true,
  });

  const outcome = await createBroadsidesOutcome({
    actor,
    crew: selectedActor,
    dr: selectedDR,
    targetToken: targetToken,
    armorFormula: selectedArmor,
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionBroadsides"),
    description: game.i18n.localize("PB.ShipBroadsidesMessage"),
    outcomes: [outcome],
    target: targetToken,
  });

  return outcome;
};
