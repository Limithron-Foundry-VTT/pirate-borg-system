import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createTestAbilityOutcome } from "../../outcome/actor/test-ability-outcome.js";

/**
 * @param {PBActor} actor
 * @param {String} ability
 * @param {Array.<String>} drModifiers
 * @param {Promise.<void>}
 */
export const actorRollAbilityAction = async (actor, ability, drModifiers = []) => {
  const outcome = await createTestAbilityOutcome({ actor, ability });

  return await showGenericCard({
    title: game.i18n.localize(CONFIG.PB.abilities[ability]),
    description: getDescription(drModifiers),
    actor,
    outcomes: [outcome],
  });
};

/**
 * @param {Array.<String>} drModifiers
 * @returns {String}
 */
const getDescription = (drModifiers) => drModifiers.join("<br />");
