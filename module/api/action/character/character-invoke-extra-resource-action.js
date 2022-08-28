import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createInvokeExtraResourceOutcome } from "../../outcome/character/invoke-extra-resource-outcome.js";
import { characterUseItemAction } from "./character-use-item-action.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @returns {Promise.<Object>}
 */
export const characterInvokeExtraResourceAction = async (actor, item) => {
  if (actor.extraResource.value < 1) {
    ui.notifications.error(
      `${game.i18n.format("PB.NoResourceUsesRemaining", {
        type: item.invokableType,
      })}!`
    );
    return;
  }

  const outcome = await createInvokeExtraResourceOutcome({ actor });

  console.log(outcome);

  await actor.updateExtraResource({
    value: Math.max(0, actor.extraResource.value - 1),
  });

  const chatMessage = await showGenericCard({
    actor,
    title: item.name,
    description: item.getData().description,
    outcomes: [outcome],
  });

  await characterUseItemAction(actor, item, outcome, chatMessage);
};
