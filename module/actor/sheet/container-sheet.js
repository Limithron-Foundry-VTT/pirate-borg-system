import PBActorSheet from "./actor-sheet.js";
import { LootSheetHelper } from "../loot-helper.js";
import { emitLootItems, emitLootCurrency, emitDistributeCurrency } from "../../system/sockets.js";
import { isLootCurrencyEnabled, isLootAllEnabled } from "../../system/settings.js";

export class PBActorSheetContainer extends PBActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["pirateborg", "sheet", "actor", "container"],
    position: { width: 600, height: 700 },
    resizable: true,
    form: {
      handler: PBActorSheetContainer.#onSubmitForm,
      submitOnChange: true,
      closeOnSubmit: false,
    },
  };

  static PARTS = {
    main: {
      template: "systems/pirateborg/templates/actor/container-sheet.html",
      scrollable: [".tab"],
    },
  };

  static TABS = {
    sheet: {
      tabs: [
        { id: "inventory", group: "sheet", label: "PB.LootInventory" },
        { id: "permissions", group: "sheet", label: "PB.LootPermissions" },
        { id: "description", group: "sheet", label: "PB.TabDescription" },
      ],
      initial: "inventory",
      labelAttr: "label",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const items = context.items.filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type)).sort((a, b) => a.name.localeCompare(b.name));
    const toNumber = (value, fallback = 0) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const totalItems = items.length;
    const contentCount = items.reduce((sum, item) => {
      const quantity = Math.max(0, toNumber(item.system.quantity, 1));
      return sum + quantity;
    }, 0);
    const itemValueTotal = items.reduce((sum, item) => {
      const quantity = Math.max(0, toNumber(item.system.quantity, 1));
      const price = toNumber(item.system.price, 0);
      return sum + price * quantity;
    }, 0);

    const silver = Math.max(0, toNumber(this.actor.system.silver, 0));
    const totalValue = itemValueTotal + silver;

    const playerData = [];
    const defaultPermission = this.actor.ownership.default || 0;
    if (this.actor.isOwner) {
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

    context.loot = {
      items,
      totalItems,
      contentCount,
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

    return context;
  }

  _onRender() {
    super._onRender();
    this._updateResponsiveLayout();

    if (!this.actor.isOwner) {
      this.element.querySelectorAll(".item-loot").forEach((el) => el.addEventListener("click", (ev) => this._onLootItem(ev, false)));
      this.element.querySelectorAll(".item-loot-all").forEach((el) => el.addEventListener("click", (ev) => this._onLootItem(ev, true)));
      this.element.querySelector(".loot-currency")?.addEventListener("click", this._onLootCurrency.bind(this));
      this.element.querySelector(".split-currency")?.addEventListener("click", this._onSplitCurrency.bind(this));
      this.element.querySelector(".loot-all")?.addEventListener("click", this._onLootAll.bind(this));
    }

    if (!this.isEditable) return;

    if (this.actor.isOwner) {
      this.element.querySelectorAll(".permission-all-toggle").forEach((el) => el.addEventListener("click", this._onCycleDefaultPermission.bind(this)));
      this.element
        .querySelectorAll(".permission-proficiency:not(.permission-all-toggle)")
        .forEach((el) => el.addEventListener("click", this._onCyclePermission.bind(this)));
    }

    this.element.querySelectorAll(".item-edit").forEach((el) => el.addEventListener("click", this._onItemEdit.bind(this)));
    this.element.querySelectorAll(".item-delete").forEach((el) => el.addEventListener("click", this._onItemDelete.bind(this)));
    this.element.querySelectorAll(".item-quantity-input").forEach((el) => el.addEventListener("change", this._onItemQuantityChange.bind(this)));
  }

  setPosition(position = {}) {
    const result = super.setPosition(position);
    this._updateResponsiveLayout();
    return result;
  }

  _updateResponsiveLayout() {
    const sheetWidth = this.position.width || 600;
    const form = this.element?.querySelector("form");
    if (!form) return;
    form.classList.toggle("narrow", sheetWidth < 500);
    form.classList.toggle("compact", sheetWidth < 550);
  }

  static async #onSubmitForm(event, form, formData) {
    await this.actor.update(formData.object);
  }

  static _getPermissionIcon(level) {
    const icons = {
      0: '<i class="far fa-circle"></i>',
      2: '<i class="fas fa-eye"></i>',
      3: '<i class="fas fa-check"></i>',
    };
    return icons[level] || icons[0];
  }

  static _getPermissionDescription(level) {
    const descriptions = {
      0: game.i18n.localize("PB.LootPermissionNone"),
      2: game.i18n.localize("PB.LootPermissionObserver"),
      3: game.i18n.localize("PB.LootPermissionOwner"),
    };
    return descriptions[level] || descriptions[0];
  }

  static _getDefaultPermissionDescription(level) {
    const descriptions = {
      0: game.i18n.localize("PB.LootDefaultPermissionNone"),
      2: game.i18n.localize("PB.LootDefaultPermissionObserver"),
    };
    return descriptions[level] || descriptions[0];
  }

  async _onCyclePermission(event) {
    event.preventDefault();
    const playerId = event.currentTarget.closest(".permission")?.dataset.playerId;
    const currentPermission = LootSheetHelper.getLootPermissionForPlayer(this.actor, game.users.get(playerId));

    const levels = [0, 2, 3];
    const currentIndex = levels.indexOf(currentPermission);
    const newLevel = levels[(currentIndex + 1) % levels.length];

    const currentPermissions = foundry.utils.duplicate(this.actor.ownership);
    currentPermissions[playerId] = newLevel;
    await this.actor.update({ ownership: currentPermissions });
  }

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

  _onItemEdit(event) {
    event.preventDefault();
    const item = this.getItem(event);
    if (item) item.sheet.render({ force: true });
  }

  async _onItemDelete(event) {
    event.preventDefault();
    const itemId = this.getItemId(event);
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("PB.ItemDelete") },
      content: `<p>${game.i18n.format("PB.LootDeleteConfirm", { name: item.name })}</p>`,
    });

    if (confirmed) {
      await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
    }
  }

  async _onItemQuantityChange(event) {
    event.preventDefault();
    const input = event.currentTarget;
    const itemId = input.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const parsedValue = Number.parseInt(input.value, 10);
    if (Number.isNaN(parsedValue)) {
      input.value = item.system.quantity || 1;
      return;
    }

    const quantity = Math.max(0, parsedValue);
    if (quantity === 0) {
      await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
      return;
    }

    await item.update({ "system.quantity": quantity });
  }

  async _onLootItem(event, all = false) {
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

    const itemId = event.currentTarget.closest(".item")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const maxQuantity = item.system.quantity || 1;

    if (all || maxQuantity === 1) {
      this._emitLootRequest(itemId, maxQuantity, targetGm);
    } else {
      const quantity = await foundry.applications.api.DialogV2.prompt({
        window: { title: game.i18n.localize("PB.LootQuantityTitle") },
        content: `
          <div class="form-group">
            <label>${game.i18n.localize("PB.Quantity")}:</label>
            <input type="number" min="1" max="${maxQuantity}" name="quantity" value="1" autofocus>
          </div>
        `,
        ok: {
          label: game.i18n.localize("PB.LootLoot"),
          callback: (event, button) => {
            const val = parseInt(button.form.elements.quantity.value, 10);
            return isNaN(val) || val < 1 ? null : Math.min(val, maxQuantity);
          },
        },
      });
      if (quantity) this._emitLootRequest(itemId, quantity, targetGm);
    }
  }

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

  async _onLootAll(event) {
    event.preventDefault();

    if (!game.user.character) {
      ui.notifications.error(game.i18n.localize("PB.LootNoCharacter"));
      return;
    }

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("PB.LootLootAll") },
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

  _findActiveGM() {
    for (const user of game.users) {
      if (user.isGM && user.active) {
        return user;
      }
    }
    return null;
  }

  _emitLootRequest(itemId, quantity, targetGm) {
    emitLootItems({
      looterId: game.user.character.id,
      containerId: this.actor.id,
      items: [{ itemId, quantity }],
      processorId: targetGm.id,
    });
  }
}
