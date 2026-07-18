const grogQuantity = (value) => {
  const qty = Number(value);
  return Number.isFinite(qty) ? qty : 0;
};

export const consolidateActorGrog = async (actor) => {
  if (!actor || actor.type !== CONFIG.PB.actorTypes.character) {
    return;
  }

  const grogs = actor.items.filter((item) => item.type === CONFIG.PB.itemTypes.grog).sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

  if (grogs.length <= 1) {
    return;
  }

  const [survivor, ...duplicates] = grogs;
  const totalQuantity = grogs.reduce((sum, item) => sum + grogQuantity(item.system.quantity), 0);

  if (grogQuantity(survivor.system.quantity) !== totalQuantity) {
    await survivor.update({ "system.quantity": totalQuantity });
  }

  await actor.deleteEmbeddedDocuments(
    "Item",
    duplicates.map((item) => item.id),
  );
};
