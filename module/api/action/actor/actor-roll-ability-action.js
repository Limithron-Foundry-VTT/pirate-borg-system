import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createTestAbilityOutcome } from "../../outcome/actor/test-ability-outcome.js";

/**
 * @param {PBActor} actor
 * @param {String} ability
 * @param {Array.<String>} drModifiers
 * @returns {Promise<Object>}
 */
export const actorRollAbilityAction = async (actor, ability, drModifiers = []) => {
  const outcome = await createTestAbilityOutcome({ actor, ability });

  await showGenericCard({
    title: game.i18n.localize(CONFIG.PB.abilityKey[ability]),
    description: getDescription(drModifiers),
    actor,
    outcomes: [outcome],
  });

  return outcome;
};

/**
 * @param {Array.<String>} drModifiers
 * @returns {String}
 */
const getDescription = (drModifiers) => drModifiers.join("<br />");
