import { configureEditor } from "../../system/configure-editor.js";
import { showAddItemDialog } from "../../dialog/add-item-dialog.js";
import { actorInitiativeAction } from "../../api/action/actions.js";
import { findStartingBonusItems, findStartingBonusRollsItems } from "../../api/generator/character-generator.js";
import { getInfoFromDropData } from "../../api/utils.js";

/**
 * @extends {ActorSheet}
 */
export default class PBActorSheet extends (foundry.appv1?.sheets?.ActorSheet ?? ActorSheet) {
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
   * Adds a display string for modifiers to the effect.
   * @param {object} effect - The effect to modify.
   * @returns {object} The modified effect.
   */
  static addModifierDisplay = (effect) => {
    const modifiers = [];
    effect.changes.forEach((change) => {
      if (change.key.includes("combat.")) {
        const modifier = change.key.replace("system.attributes.combat.", "");
        const value = change.value;
        let displayName = "";

        switch (modifier) {
          case "attackModifier":
            displayName = game.i18n.localize("PB.Attack");
            break;
          case "defenseModifier":
            displayName = game.i18n.localize("PB.Defense");
            break;
          case "initiativeModifier":
            displayName = game.i18n.localize("PB.Initiative");
            break;
          case "damageModifier":
            displayName = game.i18n.localize("PB.Damage");
            break;
          case "armorTierModifier":
            displayName = game.i18n.localize("PB.ArmorTier");
            break;
          case "speedModifier":
            displayName = game.i18n.localize("PB.Speed");
            break;
          case "luckDieModifier":
            displayName = game.i18n.localize("PB.LuckDie");
            break;
          case "drModifier":
            displayName = game.i18n.localize("PB.DR");
            break;
        }

        if (displayName && value !== 0) {
          modifiers.push(`${value > 0 ? "+" : ""}${value} ${displayName}`);
        }
      } else if (change.key.includes("abilities.") || change.key.includes("attributes.")) {
        // Handle other attribute modifiers
        const parts = change.key.split(".");
        const attrName = parts[parts.length - 2] || parts[parts.length - 1];
        const value = change.value;

        if (value !== 0) {
          let displayName = attrName.charAt(0).toUpperCase() + attrName.slice(1);
          if (parts.includes("max")) displayName += " (Max)";

          modifiers.push(`${value > 0 ? "+" : ""}${value} ${displayName}`);
        }
      }
    });

    // Just add modifierDisplay to the existing effect without changing the structure
    effect.modifierDisplay = modifiers.join(", ") || null;
    return effect;
  };

  constructEffectLists(sheetData) {
    const effects = {};

    effects.temporary = sheetData.actor.effects.filter((i) => i.isTemporary && !i.disabled && !i.isCondition).map(PBActorSheet.addModifierDisplay);
    effects.disabled = sheetData.actor.effects.filter((i) => i.disabled && !i.isCondition).map(PBActorSheet.addModifierDisplay);
    effects.passive = sheetData.actor.effects.filter((i) => !i.isTemporary && !i.disabled && !i.isCondition).map(PBActorSheet.addModifierDisplay);

    sheetData.effects = effects;
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
   * @param {JQuery.<HTMLElement>} html
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Handle ProseMirror editor toggle (v13+)
    if (game.release.generation >= 13) {
      // Edit button click - set editing state and re-render
      html.find(".pb-edit-button").click((ev) => {
        const wrapper = $(ev.currentTarget).closest(".pb-editor-wrapper");
        const target = wrapper.data("target");
        this._editingDescriptionTarget = target;
        this.render();
      });

      // Handle prose-mirror editors
      html.find("prose-mirror").each((i, editor) => {
        // Use MutationObserver to inject cancel button when menu appears
        const observer = new MutationObserver((mutations, obs) => {
          const menu = editor.querySelector("menu");
          if (menu && !menu.querySelector(".pb-cancel-button")) {
            const cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "pb-cancel-button";
            cancelBtn.title = "Cancel editing";
            cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
            cancelBtn.addEventListener("click", (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              this._editingDescriptionTarget = null;
              this.render();
            });
            menu.appendChild(cancelBtn);
            obs.disconnect(); // Stop observing once button is added
          }
        });

        observer.observe(editor, { childList: true, subtree: true });

        // Also try immediately in case menu already exists
        const menu = editor.querySelector("menu");
        if (menu && !menu.querySelector(".pb-cancel-button")) {
          const cancelBtn = document.createElement("button");
          cancelBtn.type = "button";
          cancelBtn.className = "pb-cancel-button";
          cancelBtn.title = "Cancel editing";
          cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
          cancelBtn.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this._editingDescriptionTarget = null;
            this.render();
          });
          menu.appendChild(cancelBtn);
          observer.disconnect();
        }

        // Handle save event
        editor.addEventListener("save", () => {
          this._editingDescriptionTarget = null;
          this.submit();
        });
      });
    }

    if (!this.options.editable) return;

    this.bindSelectorsEvent("click", {
      ".item-create": this._onItemCreate,
      ".item-edit": this._onItemEdit,
      ".item-delete": this._onItemDelete,
      ".item-qty-plus": this._onItemAddQuantity,
      ".item-qty-minus": this._onItemSubtractQuantity,
      ".individual-initiative-button": this._onIndividualInitiativeRoll,
    });

    html.find(".effect-create").click(this._onEffectCreate.bind(this));
    html.find(".effect-edit").click(this._onEffectEdit.bind(this));
    html.find(".effect-delete").click(this._onEffectDelete.bind(this));
    html.find(".effect-toggle").click(this._onEffectToggle.bind(this));
    html.find(".effect-select").change(this._onEffectSelect.bind(this));
  }

  async _onEffectCreate(ev) {
    const type = ev.currentTarget.attributes["data-type"].value;
    const isTemporary = type === "temporary";
    const defaultName = game.i18n.localize("PB.EffectsNew");
    const effectData = {
      name: defaultName,
      icon: "icons/svg/aura.svg",
    };

    let html;
    const templateData = { isTemporary };
    if (game.release.generation >= 13) {
      html = await foundry.applications.handlebars.renderTemplate("systems/pirateborg/templates/dialog/quick-effect.html", templateData);
    } else {
      html = await renderTemplate("systems/pirateborg/templates/dialog/quick-effect.html", templateData);
    }
    const dialog = new Dialog({
      title: game.i18n.localize("PB.EffectsQuick"),
      content: html,
      buttons: {
        create: {
          label: game.i18n.localize("PB.EffectsCreate"),
          callback: (html) => {
            const labelValue = html.find(".label").val();
            effectData.name = labelValue || defaultName;
            effectData.changes = [
              {
                key: html.find(".key").val(),
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: parseInt(html.find(".modifier").val()) || 0,
              },
            ];

            // Handle duration for temporary effects
            if (isTemporary) {
              const durationRounds = parseInt(html.find(".duration").val()) || 1;
              effectData["duration.rounds"] = durationRounds;
              // Set start round/turn if combat is active for proper duration tracking
              if (game.combat?.started) {
                effectData["duration.startRound"] = game.combat.round;
                effectData["duration.startTurn"] = game.combat.turn;
              }
            }

            this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
          },
        },
        skip: {
          label: game.i18n.localize("PB.EffectsSkip"),
          callback: () => {
            // For skip, still set default duration for temporary effects
            if (isTemporary) {
              effectData["duration.rounds"] = 1;
              if (game.combat?.started) {
                effectData["duration.startRound"] = game.combat.round;
                effectData["duration.startTurn"] = game.combat.turn;
              }
            }
            this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]).then((effect) => effect[0].sheet.render(true));
          },
        },
      },
      default: "create",
    });
    await dialog._render(true);
    dialog._element.find(".label").select();
  }

  _onEffectSelect(ev) {
    this.actor.addCondition(ev.currentTarget.value);
  }

  _onEffectEdit(ev) {
    const id = $(ev.currentTarget).parents(".item").attr("data-effect-id");
    let effect = this.object.effects.get(id);

    if (!effect) {
      // Try to find the item with the effect
      effect = this.object.items.find((item) => item.effects.has(id))?.effects.get(id);
      if (!effect) {
        console.error(`Effect with ID ${id} not found for editing`);
        ui.notifications.error(`${game.i18n.localize("PB.EffectsNotFound")}: ${id}`);
        return;
      }
    }

    effect.sheet.render(true);
  }

  _onEffectDelete(ev) {
    const id = $(ev.currentTarget).parents(".item").attr("data-effect-id");
    let parent = this.object;
    let effect = parent.effects.get(id);

    if (!effect) {
      // Try to find the item with the effect
      effect = parent.items.find((item) => item.effects.has(id))?.effects.get(id);
      if (!effect) {
        console.error(`Effect with ID ${id} not found for deletion`);
        ui.notifications.error(`${game.i18n.localize("PB.EffectsNotFound")}: ${id}`);
        return;
      }
      parent = effect.parent;
    }

    parent.deleteEmbeddedDocuments("ActiveEffect", [id]);
  }

  _onEffectToggle(ev) {
    const id = $(ev.currentTarget).parents(".item").attr("data-effect-id");
    let effect = this.object.effects.get(id);

    if (!effect) {
      // Try to find the item with the effect
      effect = this.object.items.find((item) => item.effects.has(id))?.effects.get(id);
      if (!effect) {
        console.error(`Effect with ID ${id} not found. Available effects:`, Array.from(this.object.effects.keys()));
        ui.notifications.error(`${game.i18n.localize("PB.EffectsNotFound")}: ${id}`);
        return;
      }
    }

    effect.update({ disabled: !effect.disabled });
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onItemEdit(event) {
    event.preventDefault();
    const item = this.getItem(event);
    if (item) {
      item.sheet.render(true);
    }
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const { name, type } = await showAddItemDialog();
    await this.actor.createEmbeddedDocuments("Item", [
      {
        name,
        type,
      },
    ]);
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
    return Dialog.confirm({
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
    await item.setQuantity(item.quantity + 1);
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onItemSubtractQuantity(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await item.setQuantity(Math.max(1, item.quantity - 1));
  }

  /**
   * @private
   *
   * @param {MouseEvent} event
   */
  async _onIndividualInitiativeRoll(event) {
    event.preventDefault();
    await actorInitiativeAction(this.actor);
  }

  /**
   * @override
   *
   * @param {DragEvent} event
   * @param {Object} itemData
   */
  async _onDropItem(event, itemData) {
    const item = ((await super._onDropItem(event, itemData)) || []).pop();
    if (!item) return;

    const { item: originalItem, actor: originalActor } = await getInfoFromDropData(itemData);

    const target = this.getItem(event);
    const isContainer = originalItem && originalItem.isContainer;

    await this._cleanDroppedItem(item);

    if (isContainer) {
      await item.clearItems();
      const newItems = await this.actor.createEmbeddedDocuments(
        "Item",
        originalItem.items.map((itemId) => {
          const item = originalActor.items.get(itemId);
          return item.toObject(false);
        })
      );

      await this._addItemsToItemContainer(newItems, item);
    }

    if (item.type === CONFIG.PB.itemTypes.background) {
      const additionalItems = [].concat(
        (await findStartingBonusItems([item])).map((i) => i.toObject()),
        (await findStartingBonusRollsItems([item])).map((i) => i.toObject())
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
   * @param {DragEvent} event
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
   * @param {PBItem} container
   */
  async _addItemsToItemContainer(items, container) {
    for (const item of items) {
      if (item.container && container.id !== item.container.id) {
        // transfer container
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
   * @param {PBItem} item
   */
  async _removeItemFromItemContainer(item) {
    if (item.container) {
      await item.container.removeItem(item.id);
    }
  }

  /** @override */
  async _updateObject(event, formData) {
    // V10
    if (!this.actor.system) {
      formData = Object.keys(formData).reduce((data, key) => {
        data[key.replace("system.", "data.")] = formData[key];
        return data;
      }, {});
    }
    return super._updateObject(event, formData);
  }

  /** @override */
  async getData(options) {
    const formData = super.getData(options);
    formData.config = CONFIG.PB;

    // Ensure editable flag is available for templates
    formData.editable = this.isEditable;

    // Editor data for v13+ ProseMirror
    formData.descriptionSource = this.actor.system?.description || "";
    formData.documentUuid = this.actor.uuid;

    // Check if we're in editing mode
    if (this._editingDescriptionTarget) {
      formData.editingDescription = {
        target: this._editingDescriptionTarget,
        value: this.actor.system?.description || ""
      };
    }

    // V10 Backward compatibility
    if (!this.actor.system) {
      formData.data.system = formData.data.data;
      formData.data.items = formData.items.map((item) => {
        item.system = item.data;
        delete item.data;
        return item;
      });
      delete formData.data.data;
    }

    formData.descriptionHTML = formData.data.system.description
      ? await (game.release.generation >= 13 ? foundry.applications.ux.TextEditor.implementation : TextEditor).enrichHTML(formData.data.system.description, {
          secrets: !!formData.owner,
          links: true,
          async: true,
        })
      : "";

    this.constructEffectLists(formData);

    formData.data.items.forEach((item) => {
      if (item.type === CONFIG.PB.itemTypes.container) {
        item.system.dynamic = {
          ...item.system.dynamic,
          items: item.system.items?.map((itemId) => formData.items.find((item) => item._id === itemId)) ?? [],
        };
      }
      return item;
    });

    formData.data.localizedType = `TYPES.${formData.actor.documentName}.${formData.data.type}`;

    // Calculate effective speed for display
    if (formData.data.type === "character") {
      const baseSpeed = formData.data.system.attributes?.speed?.max ?? 6;
      const speedModifier = formData.data.system.attributes?.combat?.speedModifier ?? 0;
      formData.effectiveSpeed = baseSpeed + speedModifier;
    }

    return formData;
  }
}
