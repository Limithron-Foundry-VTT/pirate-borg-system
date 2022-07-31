import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";
import { createSmallarmsOutcome } from "../../outcome/ship/ship-smallarms-outcome.js";
import { showGenericCard } from "../../../chat-message/generic-card.js";

/**
 * @param {PBActor} actor
 * @param {Boolean} isPCAction
 * @returns {Promise.<void>}
 */
export const shipSmallArmsAction = async (actor, isPCAction) => {
  const { selectedActor, selectedDR, selectedArmor, targetToken } = await showCrewActionDialog({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionSmallArms"),
    description: game.i18n.localize("PB.ShipSmallArmsMessage"),
    enableCrewSelection: isPCAction,
    enableDrSelection: true,
    enableArmorSelection: true,
    enableTargetSelection: true,
  });

  const outcome = await createSmallarmsOutcome({
    actor,
    crew: selectedActor,
    dr: selectedDR,
    targetToken: targetToken,
    armorFormula: selectedArmor,
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionSmallArms"),
    description: game.i18n.localize("PB.ShipSmallArmsMessage"),
    outcomes: [outcome],
    target: targetToken,
  });
};
