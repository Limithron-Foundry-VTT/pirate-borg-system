/**
 * Helper class for loot sheet operations.
 */
export class LootSheetHelper {
  /**
   * Get the loot permission level for a player on an actor.
   * @param {Actor} actor
   * @param {User} player
   * @returns {number} 0=none, 2=observer, 3=owner
   */
  static getLootPermissionForPlayer(actor, player) {
    if (player.id in actor.ownership) {
      return actor.ownership[player.id];
    }
    return actor.ownership.default ?? 0;
  }

  /**
   * Distribute silver evenly among observer players with characters.
   * @param {Actor} containerActor
   */
  static async distributeCoins(containerActor) {
    const observers = [];

    for (const player of game.users.players) {
      const permission = LootSheetHelper.getLootPermissionForPlayer(containerActor, player);
      if (permission >= 2 && player.character && (player.role === 1 || player.role === 2)) {
        observers.push(player.character);
      }
    }

    if (observers.length === 0) return;

    const containerSilver = containerActor.system.silver || 0;
    if (containerSilver <= 0) return;

    const splitAmount = Math.floor(containerSilver / observers.length);
    const remainder = containerSilver % observers.length;

    if (splitAmount <= 0) return;

    for (const observer of observers) {
      const currentSilver = observer.system.silver || 0;
      await observer.update({ "system.silver": currentSilver + splitAmount });

      ChatMessage.create({
        user: game.user.id,
        speaker: { actor: containerActor, alias: containerActor.name },
        content: `<b>${observer.name}</b> ${game.i18n.localize("PB.LootReceives")} ${splitAmount} ${game.i18n.localize("PB.Silver")}.`,
      });
    }

    await containerActor.update({ "system.silver": remainder });
  }
}

/**
 * Dialog for selecting a quantity of items to loot.
 */
export class QuantityDialog extends Dialog {
  constructor(callback, options = {}) {
    let applyChanges = false;
    super({
      title: game.i18n.localize("PB.LootQuantityTitle"),
      content: `
        <form>
          <div class="form-group">
            <label>${game.i18n.localize("PB.Quantity")}:</label>
            <input type="number" min="1" id="quantity" name="quantity" value="1">
          </div>
        </form>`,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: options.acceptLabel || game.i18n.localize("PB.LootAccept"),
          callback: () => (applyChanges = true),
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize("PB.Cancel"),
        },
      },
      default: "yes",
      close: () => {
        if (applyChanges) {
          const quantity = parseInt(document.getElementById("quantity").value);
          if (isNaN(quantity) || quantity < 1) {
            ui.notifications.error(game.i18n.localize("PB.LootInvalidQuantity"));
            return;
          }
          callback(quantity);
        }
      },
    });
  }
}
