import { showGenericCard } from "../../../chat-message/generic-card.js";
import { showCrewActionDialog } from "../../../dialog/crew-action-dialog.js";
import { createArmorOutcome } from "../../outcome/actor/armor-outcome.js";
import { createInflictDamageOutcome } from "../../outcome/actor/inflict-damage-outcome.js";
import { createRamOutcome } from "../../outcome/ship/ship-ram-outcome.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} weapon
 * @returns {Promise.<Outcome>}
 */
export const shipRamAction = async (actor) => {
  const { selectedArmor, selectedMovement, targetToken } = await showCrewActionDialog({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionRam"),
    description: game.i18n.localize("PB.ShipRamMessage"),
    enableArmorSelection: true,
    enableMovementSelection: true,
    enableTargetSelection: true,
  });

  const armorOutcome = await createArmorOutcome({ formula: selectedArmor });

  const inflictDamageOutcome = await createInflictDamageOutcome({
    actor,
    formula: getFormula(actor, targetToken, selectedMovement),
    damageReduction: armorOutcome.total,
    targetToken,
  });

  const hitOutcome = await createRamOutcome({ actor, targetToken });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.ShipCrewActionRam"),
    description: game.i18n.localize("PB.ShipRamMessage"),
    outcomes: [hitOutcome, inflictDamageOutcome, armorOutcome],
    target: targetToken,
  });

  return hitOutcome;
};

const getFormula = (actor, targetToken, selectedMovement) => {
  return actor.getScaledDamageFormula(targetToken?.actor, `${actor.ramDie} + ${selectedMovement}`);
};
