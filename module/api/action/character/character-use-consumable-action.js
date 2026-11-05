import { createChatMessageWithVisibility, getOtherChatMessageStyle } from "../../../chat-message/chat-message-visibility.js";

/**
 * Copy the consumable's effects onto the actor and use up one of it.
 * @param {PBActor} actor
 * @param {PBItem} item
 */
export const characterUseConsumableAction = async (actor, item) => {
  const effects = item.effects.map((effect) => {
    const data = effect.toObject();
    delete data._id;
    // Drop the start so core starts the duration now
    delete data.start;
    for (const key of ["startTime", "startRound", "startTurn", "combat"]) delete data.duration?.[key];
    data.transfer = false;
    data.origin = item.uuid;
    return data;
  });
  if (effects.length) await actor.createEmbeddedDocuments("ActiveEffect", effects);

  await createChatMessageWithVisibility({
    content: game.i18n.format("PB.ItemConsumed", { actor: actor.name, item: item.name }),
    speaker: ChatMessage.getSpeaker({ actor }),
    style: getOtherChatMessageStyle(),
  });

  if (item.quantity > 1) await item.update({ "system.quantity": item.quantity - 1 });
  else await item.delete();
};
