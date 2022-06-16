import { configureEditor } from "../../system/configure-editor.js";
import { showAddItemDialog } from "../../dialog/add-item-dialog.js";
import { actorInitiativeAction } from "../../api/action/actions.js";
import { findStartingBonusItems, findStartingBonusRollsItems } from "../../api/generator/character-generator.js";

/**
 * @extends {ActorSheet}
 */
export default class PBActorSheet extends ActorSheet {
  /**
   * @override
   */
  activateEditor(name, options = {}, initialContent = "") {
    configureEditor(options);
    super.activateEditor(name, options, initialContent);
  }

  /**
   * @param {String} event
   * @param {Object} listeners
   */
  bindSelectorsEvent(event, listeners) {
    for (const [selector, callback] of Object.entries(listeners)) {
      this.element.find(selector).on(event, callback.bind(this));
    }
  }

  /**
   * @param {MouseEvent} event
   * @returns {PBItem}
   */
  getItem(event) {
    return this.actor.items.get(this.getItemId(event));
  }

  /**
   * @param {MouseEvent} event
   * @returns {String}
   */
  getItemId(event) {
    return $(event.target).closest(".item").data("itemId");
  }

  /**
   * @override
   *
   * @param {jQuery} html
   */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;

    this.bindSelectorsEvent("click", {
      ".item-create": this._onItemCreate,
      ".item-edit": this._onItemEdit,
      ".item-delete": this._onItemDelete,
      ".item-qty-plus": this._onItemAddQuantity,
      ".item-qty-minus": this._onItemSubtractQuantity,
      ".individual-initiative-button": this._onIndividualInitiativeRoll,
    });
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onItemEdit(event) {
    event.preventDefault();
    this.getItem(event).sheet.render(true);
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const { name, type } = await showAddItemDialog();
    await this.actor.createEmbeddedDocuments("Item", [{ name, type }]);
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onItemDelete(event) {
    event.preventDefault();
    const item = this.getItem(event);
    const canDelete = item.isContainer && item.hasItems ? await this._confirmItemDelete() : true;
    if (canDelete) {
      await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
    }
  }

  /**
   * @private
   *
   * @returns {Promise.<Boolean>}
   */
  async _confirmItemDelete() {
    return await Dialog.confirm({
      title: game.i18n.localize("PB.ItemDelete"),
      content: `<p>${game.i18n.localize("PB.ItemDeleteMessage")}</p>`,
      defaultYes: false,
    });
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onItemAddQuantity(event) {
    event.preventDefault();
    const item = this.getItem(event);
    item.setQuantity(item.quantity + 1);
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onItemSubtractQuantity(event) {
    event.preventDefault();
    const item = this.getItem(event);
    item.setQuantity(Math.max(1, item.quantity - 1));
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onIndividualInitiativeRoll(event) {
    event.preventDefault();
    actorInitiativeAction(this.actor);
  }

  /**
   * @override
   *
   * @param {Event} event
   * @param {Object} itemData
   */
  async _onDropItem(event, itemData) {
    const item = ((await super._onDropItem(event, itemData)) || []).pop();
    if (!item) return;

    const target = this.getItem(event);
    const originalActor = game.actors.get(itemData.actorId);
    const originalItem = originalActor ? originalActor.items.get(itemData.data._id) : null;
    const isContainer = originalItem && originalItem.isContainer;

    await this._cleanDroppedItem(item);

    if (isContainer) {
      item.clearItems();
      const newItems = await this.actor.createEmbeddedDocuments("Item", originalItem.itemsData);
      await this._addItemsToItemContainer(newItems, item);
    }

    if (item.type === CONFIG.PB.itemTypes.background) {
      const additionalItems = [].concat(
        (await findStartingBonusItems([item])).map((i) => i.toObject()),
        (await findStartingBonusRollsItems([item])).map((i) => i.toObject()),
      );
      if (additionalItems.length > 0) {
        await this.actor.createEmbeddedDocuments("Item", additionalItems);
      }
    }

    if (originalItem) {
      await originalActor.deleteEmbeddedDocuments("Item", [originalItem.id]);
    }

    if (target) {
      await this._handleDropOnItemContainer(item, target);
    }
  }

  /**
   * @override
   *
   * @param {Event} event
   * @param {Object} itemData
   */
  async _onSortItem(event, itemData) {
    const item = this.actor.items.get(itemData._id);
    const target = this.getItem(event);
    if (target) {
      await this._handleDropOnItemContainer(item, target);
    } else {
      await this._removeItemFromItemContainer(item);
    }
    await super._onSortItem(event, itemData);
  }

  /**
   * @private
   *
   * @param {PBItem} item
   */
  async _cleanDroppedItem(item) {
    if (item.equipped) {
      await item.unequip();
    }
    if (!item.carried) {
      await item.carry();
    }
  }

  /**
   * @private
   *
   * @param {PBItem} item
   * @param {PBItem} target
   */
  async _handleDropOnItemContainer(item, target) {
    if (item.isContainerizable) {
      if (target.isContainer) {
        // dropping into a container
        await this._addItemsToItemContainer([item], target);
      } else if (target.hasContainer) {
        // dropping into an item in a container
        await this._addItemsToItemContainer([item], target.container);
      } else {
        // dropping into a normal item
        await this._removeItemFromItemContainer(item);
      }
    }
  }

  /**
   * @private
   *
   * @param {Array.<PBItem>} items
   * @param {PBItem} target
   */
  async _addItemsToItemContainer(items, container) {
    for (const item of items) {
      if (item.container && container.id !== item.container.id) {
        // transfert container
        await item.container.removeItem(item.id);
      }
      if (item.equipped) {
        // unequip the item
        await item.unequip();
      }
      await container.addItem(item.id);
    }
  }

  /**
   * @private
   *
   * @param {PBItem} items
   */
  async _removeItemFromItemContainer(item) {
    if (item.container) {
      await item.container.removeItem(item.id);
    }
  }
}
