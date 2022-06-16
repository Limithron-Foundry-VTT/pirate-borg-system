import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createInvokeExtraResourceOutcome } from "../../outcome/character/invoke-extra-resource-outcome.js";

/**
 * @param {PBActor} actor
 * @param {PBItem} item
 * @returns {Promise.<Outcome>}
 */
export const characterInvokeExtraResourceAction = async (actor, item) => {
  if (actor.extraResource.value < 1) {
    ui.notifications.error(
      `${game.i18n.format("PB.NoResourceUsesRemaining", {
        type: item.invokableType,
      })}!`,
    );
    return;
  }

  const outcome = await createInvokeExtraResourceOutcome({ actor });

  await actor.updateExtraResource({
    value: Math.max(0, actor.extraResource.value - 1),
  });

  await showGenericCard({
    actor,
    title: item.name,
    description: item.getData().description,
    outcomes: [outcome],
  });

  // await this.useActionMacro(item.id);
};
