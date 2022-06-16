import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createInvokeRelicOutcome } from "../../outcome/character/invoke-relic-outcome.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @returns {Promise.<Outcome>}
 */
export const characterInvokeRelicAction = async (actor, item) => {
  const outcome = await createInvokeRelicOutcome({ actor });

  await showGenericCard({
    actor,
    title: item.name,
    description: item.getData().description,
    outcomes: [outcome],
  });

  // await this.useActionMacro(item.id);
};
