import { LootSheetHelper } from "../actor/loot-helper.js";
import { isLootChatMessagesEnabled } from "./settings.js";

const ACTION = {
  SCROLL_CHAT_TO_BOTTOM: "scroll-chat-to-bottom",
  DAMAGE_ON_TOKEN: "damage-on-token",
  LOOT_ITEMS: "loot-items",
  LOOT_CURRENCY: "loot-currency",
  DISTRIBUTE_CURRENCY: "distribute-currency",
};

export const registerSocketHandler = () => {
  game.socket.on("system.pirateborg", async ({ action, data } = {}) => {
    switch (action) {
      case ACTION.SCROLL_CHAT_TO_BOTTOM:
        scrollChatToBottom();
        break;
      case ACTION.LOOT_ITEMS:
        if (game.user.isGM && data?.processorId === game.user.id) {
          await handleLootItems(data);
        }
        break;
      case ACTION.LOOT_CURRENCY:
        if (game.user.isGM && data?.processorId === game.user.id) {
          await handleLootCurrency(data);
        }
        break;
      case ACTION.DISTRIBUTE_CURRENCY:
        if (game.user.isGM && data?.processorId === game.user.id) {
          await handleDistributeCurrency(data);
        }
        break;
    }
  });
};

const scrollChatToBottom = () => ui.chat.scrollBottom();

export const emitScrollChatToBottom = () => game.socket.emit("system.pirateborg", { action: ACTION.SCROLL_CHAT_TO_BOTTOM });

/**
 * Emit a loot items request via socket.
 * @param {Object} data
 * @param {string} data.looterId - The actor ID of the character looting
 * @param {string} data.containerId - The container actor ID
 * @param {Array<{itemId: string, quantity: number}>} data.items - Items to loot
 * @param {string} data.processorId - The GM user ID to process this
 */
export const emitLootItems = (data) => {
  game.socket.emit("system.pirateborg", { action: ACTION.LOOT_ITEMS, data });
};

/**
 * Emit a loot currency request via socket.
 * @param {Object} data
 * @param {string} data.looterId
 * @param {string} data.containerId
 * @param {string} data.processorId
 */
export const emitLootCurrency = (data) => {
  game.socket.emit("system.pirateborg", { action: ACTION.LOOT_CURRENCY, data });
};

/**
 * Emit a distribute currency request via socket.
 * @param {Object} data
 * @param {string} data.containerId
 * @param {string} data.processorId
 */
export const emitDistributeCurrency = (data) => {
  game.socket.emit("system.pirateborg", { action: ACTION.DISTRIBUTE_CURRENCY, data });
};

/**
 * GM-side handler: transfer items from container to looter.
 */
async function handleLootItems(data) {
  const container = game.actors.get(data.containerId);
  const looter = game.actors.get(data.looterId);
  if (!container || !looter) return;

  for (const itemData of data.items) {
    const item = container.items.get(itemData.itemId);
    if (!item) continue;

    const quantity = Math.min(itemData.quantity, item.system.quantity || 1);

    const newItemData = item.toObject();
    newItemData.system.quantity = quantity;

    const existingItem = looter.items.find((i) => i.name === item.name && i.type === item.type);
    if (existingItem) {
      const newQty = (existingItem.system.quantity || 1) + quantity;
      await existingItem.update({ "system.quantity": newQty });
    } else {
      await looter.createEmbeddedDocuments("Item", [newItemData]);
    }

    const remainingQty = (item.system.quantity || 1) - quantity;
    if (remainingQty <= 0) {
      await container.deleteEmbeddedDocuments("Item", [item.id]);
    } else {
      await item.update({ "system.quantity": remainingQty });
    }

    if (isLootChatMessagesEnabled()) {
      ChatMessage.create({
        user: game.user.id,
        speaker: { actor: container, alias: container.name },
        content: `<b>${looter.name}</b> ${game.i18n.localize("PB.LootLooted")} ${quantity}x ${item.name}`,
      });
    }
  }
}

/**
 * GM-side handler: transfer all silver from container to looter.
 */
async function handleLootCurrency(data) {
  const container = game.actors.get(data.containerId);
  const looter = game.actors.get(data.looterId);
  if (!container || !looter) return;

  const containerSilver = container.system.silver || 0;
  if (containerSilver <= 0) return;

  const looterSilver = looter.system.silver || 0;
  await looter.update({ "system.silver": looterSilver + containerSilver });
  await container.update({ "system.silver": 0 });

  if (isLootChatMessagesEnabled()) {
    ChatMessage.create({
      user: game.user.id,
      speaker: { actor: container, alias: container.name },
      content: `<b>${looter.name}</b> ${game.i18n.localize("PB.LootLooted")} ${containerSilver} ${game.i18n.localize("PB.Silver")}`,
    });
  }
}

/**
 * GM-side handler: distribute silver among observers.
 */
async function handleDistributeCurrency(data) {
  const container = game.actors.get(data.containerId);
  if (!container) return;
  await LootSheetHelper.distributeCoins(container);
}
