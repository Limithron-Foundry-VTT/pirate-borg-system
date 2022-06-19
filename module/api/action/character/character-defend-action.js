import { showGenericCard } from "../../../chat-message/generic-card.js";
import { showDefendDialog } from "../../../dialog/defend-dialog.js";
import { createDefendOutcome } from "../../outcome/character/defend-outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise.<Outcome>}
 */
export const characterDefendAction = async (actor) => {
  const { defendArmor, defendDR, incomingAttack, targetToken } = await showDefendDialog({ actor });

  const outcome = await createDefendOutcome({
    actor,
    dr: defendDR,
    targetToken,
    armorFormula: defendArmor,
    damageFormula: incomingAttack,
  });

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.Defend"),
    outcomes: [outcome],
    items: [actor.equippedArmor, actor.equippedHat].filter((item) => item),
    target: targetToken,
  });

  return outcome;
};
