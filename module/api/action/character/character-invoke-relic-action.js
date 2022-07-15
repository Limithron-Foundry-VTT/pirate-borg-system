import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createInvokeRelicOutcome } from "../../outcome/character/invoke-relic-outcome.js";
import { characterUseItemAction } from "./character-use-item-action.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @returns {Promise.<void>}
 */
export const characterInvokeRelicAction = async (actor, item) => {
  const outcome = await createInvokeRelicOutcome({ actor });

  const chatMessage = await showGenericCard({
    actor,
    title: item.name,
    description: item.getData().description,
    outcomes: [outcome],
  });

  await characterUseItemAction(actor, item, outcome, chatMessage);
};
