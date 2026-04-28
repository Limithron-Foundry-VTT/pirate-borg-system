/**
 * Handle dropping an Item onto the canvas to create a loot container.
 * @param {Canvas} canvas
 * @param {Object} data - Drop data with type, uuid, x, y
 * @returns {Promise<false|void>} Return false to prevent default handling
 */
export async function handleCanvasDropLoot(canvas, data) {
  const item = await fromUuid(data.uuid);
  if (!item) return;

  const targetToken = _findTokenAtPosition(data.x, data.y);
  if (targetToken) {
    const targetActor = targetToken.actor;
    if (targetActor && targetActor.type === CONFIG.PB.actorTypes.container) {
      await _addItemToLootActor(targetActor, item);
      return false;
    }
  }

  if (!game.user.can("TOKEN_CREATE")) return;

  await _createLootActorFromDrop(item, data.x, data.y);
  return false;
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {Token|null}
 * @private
 */
function _findTokenAtPosition(x, y) {
  const tokens = canvas.tokens.placeables;
  for (const token of tokens) {
    const { x: tx, y: ty, width, height } = token.document;
    const tokenWidth = width * canvas.dimensions.size;
    const tokenHeight = height * canvas.dimensions.size;
    if (x >= tx && x <= tx + tokenWidth && y >= ty && y <= ty + tokenHeight) {
      return token;
    }
  }
  return null;
}

/**
 * @param {Actor} actor
 * @param {Item} item
 * @private
 */
async function _addItemToLootActor(actor, item) {
  const existingItem = actor.items.find((i) => i.name === item.name && i.type === item.type);

  if (existingItem) {
    const currentQty = existingItem.system.quantity || 1;
    const addQty = item.system?.quantity || 1;
    await existingItem.update({ "system.quantity": currentQty + addQty });
    ui.notifications.info(game.i18n.format("PB.LootItemAddedToStack", { name: item.name, quantity: addQty, actor: actor.name }));
  } else {
    await actor.createEmbeddedDocuments("Item", [item.toObject()]);
    ui.notifications.info(game.i18n.format("PB.LootItemAddedToLoot", { name: item.name, actor: actor.name }));
  }
}

/**
 * @returns {Promise<Folder>}
 * @private
 */
async function _getOrCreateLootFolder() {
  const folderName = game.i18n.localize("PB.LootDroppedLootFolder");
  let folder = game.folders.find((f) => f.name === folderName && f.type === "Actor");
  if (!folder) {
    folder = await Folder.create({ name: folderName, type: "Actor", color: "#6e4b1e" });
  }
  return folder;
}

/**
 * @param {Item} item
 * @param {number} x
 * @param {number} y
 * @private
 */
async function _createLootActorFromDrop(item, x, y) {
  const folder = await _getOrCreateLootFolder();

  const actor = await Actor.create({
    name: game.i18n.format("PB.LootDroppedLoot", { name: item.name }),
    type: CONFIG.PB.actorTypes.container,
    img: item.img || "systems/pirateborg/icons/misc/container.png",
    folder: folder.id,
    items: [item.toObject()],
  });

  const hg = canvas.dimensions.size / 2;
  const tokenData = {
    actorId: actor.id,
    actorLink: false,
    x: x - hg,
    y: y - hg,
    name: actor.name,
    texture: { src: actor.img },
  };

  foundry.utils.mergeObject(tokenData, canvas.grid.getSnappedPosition(tokenData.x, tokenData.y, 1));

  await canvas.scene.createEmbeddedDocuments("Token", [tokenData]);

  ui.notifications.info(game.i18n.format("PB.LootActorCreated", { name: actor.name }));
}
