import PBActorSheet from "./actor-sheet.js";
import { LootSheetHelper, QuantityDialog } from "../loot-helper.js";
import { emitLootItems, emitLootCurrency, emitDistributeCurrency } from "../../system/sockets.js";
import { isLootCurrencyEnabled, isLootAllEnabled } from "../../system/settings.js";

/**
 * @extends {PBActorSheet}
 */
export class PBActorSheetContainer extends PBActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "actor", "container"],
      template: "systems/pirateborg/templates/actor/container-sheet.html",
      width: 600,
      height: 700,
      resizable: true,
      minimizable: true,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "inventory",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /**
   * @override
   * @returns {ActorSheet.Data}
   */
  async getData(options) {
    const formData = await super.getData(options);

    const items = formData.data.items.filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type)).sort((a, b) => a.name.localeCompare(b.name));

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => {
      return sum + (item.system.price || 0) * (item.system.quantity || 1);
    }, 0);

    const silver = formData.data.system.silver || 0;

    const playerData = [];
    const defaultPermission = this.actor.ownership.default || 0;
    if (game.user.isGM) {
      for (const player of game.users.players) {
        if (player.character) {
          const permission = LootSheetHelper.getLootPermissionForPlayer(this.actor, player);
          playerData.push({
            id: player.id,
            name: player.name,
            character: player.character.name,
            permission,
            icon: PBActorSheetContainer._getPermissionIcon(permission),
            description: PBActorSheetContainer._getPermissionDescription(permission),
          });
        }
      }
    }

    formData.loot = {
      items,
      totalItems,
      totalValue,
      silver,
      isGM: game.user.isGM,
      isOwner: this.actor.isOwner,
      players: playerData,
      defaultPermission,
      defaultPermissionIcon: PBActorSheetContainer._getPermissionIcon(defaultPermission),
      defaultPermissionDescription: PBActorSheetContainer._getDefaultPermissionDescription(defaultPermission),
      lootCurrency: isLootCurrencyEnabled(),
      lootAll: isLootAllEnabled(),
    };

    return formData;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;

    this._updateResponsiveLayout(html);

    if (game.user.isGM) {
      html.find(".permission-all-toggle").click(this._onCycleDefaultPermission.bind(this));
      html.find(".permission-proficiency:not(.permission-all-toggle)").click(this._onCyclePermission.bind(this));
    }

    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));

    if (!this.actor.isOwner) {
      html.find(".item-loot").click((ev) => this._onLootItem(ev, false));
      html.find(".item-loot-all").click((ev) => this._onLootItem(ev, true));
      html.find(".loot-currency").click(this._onLootCurrency.bind(this));
      html.find(".split-currency").click(this._onSplitCurrency.bind(this));
      html.find(".loot-all").click(this._onLootAll.bind(this));
    }
  }

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    if (this.element && this.element.length) {
      this._updateResponsiveLayout(this.element.find("form"));
    }
    return position;
  }

  /**
   * @param {jQuery} html
   * @private
   */
  _updateResponsiveLayout(html) {
    const sheetWidth = this.position.width || 600;
    if (sheetWidth < 500) {
      html.addClass("narrow");
    } else {
      html.removeClass("narrow");
    }
    if (sheetWidth < 550) {
      html.addClass("compact");
    } else {
      html.removeClass("compact");
    }
  }

  /**
   * @param {number} level
   * @returns {string}
   * @private
   */
  static _getPermissionIcon(level) {
    const icons = {
      0: '<i class="far fa-circle"></i>',
      2: '<i class="fas fa-eye"></i>',
      3: '<i class="fas fa-check"></i>',
    };
    return icons[level] || icons[0];
  }

  /**
   * @param {number} level
   * @returns {string}
   * @private
   */
  static _getPermissionDescription(level) {
    const descriptions = {
      0: game.i18n.localize("PB.LootPermissionNone"),
      2: game.i18n.localize("PB.LootPermissionObserver"),
      3: game.i18n.localize("PB.LootPermissionOwner"),
    };
    return descriptions[level] || descriptions[0];
  }

  /**
   * @param {number} level
   * @returns {string}
   * @private
   */
  static _getDefaultPermissionDescription(level) {
    const descriptions = {
      0: game.i18n.localize("PB.LootDefaultPermissionNone"),
      2: game.i18n.localize("PB.LootDefaultPermissionObserver"),
    };
    return descriptions[level] || descriptions[0];
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onCyclePermission(event) {
    event.preventDefault();
    const playerId = $(event.currentTarget).closest(".permission").data("player-id");
    const currentPermission = LootSheetHelper.getLootPermissionForPlayer(this.actor, game.users.get(playerId));

    const levels = [0, 2, 3];
    const currentIndex = levels.indexOf(currentPermission);
    const newLevel = levels[(currentIndex + 1) % levels.length];

    const currentPermissions = foundry.utils.duplicate(this.actor.ownership);
    currentPermissions[playerId] = newLevel;
    await this.actor.update({ ownership: currentPermissions });
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onCycleDefaultPermission(event) {
    event.preventDefault();
    const currentDefault = this.actor.ownership.default || 0;

    const levels = [0, 2];
    const currentIndex = levels.indexOf(currentDefault);
    const newLevel = levels[(currentIndex + 1) % levels.length];

    const currentPermissions = foundry.utils.duplicate(this.actor.ownership);
    currentPermissions.default = newLevel;
    await this.actor.update({ ownership: currentPermissions });
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  _onItemEdit(event) {
    event.preventDefault();
    const item = this.getItem(event);
    if (item) item.sheet.render(true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onItemDelete(event) {
    event.preventDefault();
    const itemId = this.getItemId(event);
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("PB.ItemDelete"),
      content: `<p>${game.i18n.format("PB.LootDeleteConfirm", { name: item.name })}</p>`,
    });

    if (confirmed) {
      await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }
  }

  /**
   * @param {MouseEvent} event
   * @param {boolean} all
   * @private
   */
  _onLootItem(event, all = false) {
    event.preventDefault();

    if (!game.user.character) {
      ui.notifications.error(game.i18n.localize("PB.LootNoCharacter"));
      return;
    }

    const targetGm = this._findActiveGM();
    if (!targetGm) {
      ui.notifications.error(game.i18n.localize("PB.LootNoGM"));
      return;
    }

    const itemId = $(event.currentTarget).closest(".item").data("item-id");
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const maxQuantity = item.system.quantity || 1;

    if (all || maxQuantity === 1) {
      this._emitLootRequest(itemId, maxQuantity, targetGm);
    } else {
      new QuantityDialog(
        (quantity) => {
          quantity = Math.min(quantity, maxQuantity);
          this._emitLootRequest(itemId, quantity, targetGm);
        },
        { acceptLabel: game.i18n.localize("PB.LootLoot") }
      ).render(true);
    }
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  _onLootCurrency(event) {
    event.preventDefault();

    if (!game.user.character) {
      ui.notifications.error(game.i18n.localize("PB.LootNoCharacter"));
      return;
    }

    const targetGm = this._findActiveGM();
    if (!targetGm) {
      ui.notifications.error(game.i18n.localize("PB.LootNoGM"));
      return;
    }

    emitLootCurrency({
      looterId: game.user.character.id,
      containerId: this.actor.id,
      processorId: targetGm.id,
    });
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  _onSplitCurrency(event) {
    event.preventDefault();

    if (game.user.isGM) {
      LootSheetHelper.distributeCoins(this.actor);
    } else {
      const targetGm = this._findActiveGM();
      if (!targetGm) {
        ui.notifications.error(game.i18n.localize("PB.LootNoGM"));
        return;
      }
      emitDistributeCurrency({
        containerId: this.actor.id,
        processorId: targetGm.id,
      });
    }
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onLootAll(event) {
    event.preventDefault();

    if (!game.user.character) {
      ui.notifications.error(game.i18n.localize("PB.LootNoCharacter"));
      return;
    }

    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("PB.LootLootAll"),
      content: `<p>${game.i18n.localize("PB.LootLootAllConfirm")}</p>`,
    });
    if (!confirmed) return;

    const targetGm = this._findActiveGM();
    if (!targetGm) {
      ui.notifications.error(game.i18n.localize("PB.LootNoGM"));
      return;
    }

    if (isLootCurrencyEnabled()) {
      emitLootCurrency({
        looterId: game.user.character.id,
        containerId: this.actor.id,
        processorId: targetGm.id,
      });
    }

    const items = this.actor.items.contents
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .map((item) => ({
        itemId: item.id,
        quantity: item.system.quantity || 1,
      }));

    if (items.length > 0) {
      emitLootItems({
        looterId: game.user.character.id,
        containerId: this.actor.id,
        items,
        processorId: targetGm.id,
      });
    }
  }

  /**
   * @returns {User|null}
   * @private
   */
  _findActiveGM() {
    for (const user of game.users) {
      if (user.isGM && user.active) {
        return user;
      }
    }
    return null;
  }

  /**
   * @param {string} itemId
   * @param {number} quantity
   * @param {User} targetGm
   * @private
   */
  _emitLootRequest(itemId, quantity, targetGm) {
    emitLootItems({
      looterId: game.user.character.id,
      containerId: this.actor.id,
      items: [{ itemId, quantity }],
      processorId: targetGm.id,
    });
  }
}
