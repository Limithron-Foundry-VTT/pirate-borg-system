import { showGenericCard } from "../../../chat-message/generic-card.js";
import { drawDerelictTakesDamage } from "../../compendium.js";
import { drawOutcome } from "../../outcome/outcome.js";
/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @returns {Promise.<ChatMessage>}
 */
export const shipSinkAction = async (actor) => {
  const outcome = await drawOutcome({
    draw: await drawDerelictTakesDamage(),
    title: game.i18n.localize("PB.ShipSinkingMessage"),
  })();

  return await showGenericCard({
    title: game.i18n.localize("PB.ShipSinking"),
    actor,
    outcomes: [outcome],
  });
};
