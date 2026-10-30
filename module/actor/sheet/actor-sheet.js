import { showAddItemDialog } from "../../dialog/add-item-dialog.js";
import { actorInitiativeAction } from "../../api/action/actions.js";
import { findStartingBonusItems, findStartingBonusRollsItems } from "../../api/generator/character-generator.js";
import { getInfoFromDropData } from "../../api/utils.js";
import { buildEffectDuration, buildQuickEffectChange } from "../../api/effect-duration.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class PBActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["themed", "theme-light"],
    window: { resizable: true },
  };

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
        if (displayName && value !== 0) modifiers.push(`${value > 0 ? "+" : ""}${value} ${displayName}`);
      } else if (change.key === "system.attributes.luck.die") {
        if (change.value) modifiers.push(`${game.i18n.localize("PB.LuckDie")}: ${change.value}`);
      } else if (change.key === "system.attributes.luck.dieSizeModifier") {
        const value = change.value;
        if (Number(value) !== 0) modifiers.push(`${value > 0 ? "+" : ""}${value} ${game.i18n.localize("PB.LuckDieSize")}`);
      } else if (change.key.includes("abilities.") || change.key.includes("attributes.")) {
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
    effect.modifierDisplay = modifiers.join(", ") || null;
    return effect;
  };

  static addDurationDisplay = (effect) => {
    const duration = effect.duration;
    // v14 reports Infinity remaining outside combat; v14 deprecates duration.rounds in favour of value.
    effect.durationRemaining = Number.isFinite(duration.remaining) && duration.remaining > 0 ? duration.remaining : null;
    effect.durationTotal = "value" in duration ? duration.value : duration.rounds;
    return effect;
  };

  _buildEffectLists(context) {
    const effects = [...this.actor.allApplicableEffects()].map(PBActorSheet.addDurationDisplay);
    context.effects = {
      temporary: effects.filter((i) => i.isTemporary && !i.disabled && !i.isSuppressed && !i.isCondition).map(PBActorSheet.addModifierDisplay),
      disabled: effects.filter((i) => i.disabled && !i.isSuppressed && !i.isCondition).map(PBActorSheet.addModifierDisplay),
      passive: effects.filter((i) => !i.isTemporary && !i.disabled && !i.isSuppressed && !i.isCondition).map(PBActorSheet.addModifierDisplay),
    };
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.config = CONFIG.PB;
    context.editable = this.isEditable;

    context.descriptionHTML = this.actor.system?.description
      ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.description, {
          secrets: this.actor.isOwner,
          relativeTo: this.actor,
          rollData: this.actor.getRollData?.() ?? {},
        })
      : "";

    this._buildEffectLists(context);

    context.actor = this.actor;
    context.data = { ...this.actor.toObject(false), localizedType: context.localizedType };
    context.items = [...this.actor.items].map((item) => {
      const obj = item.toObject(false);
      if (item.type === CONFIG.PB.itemTypes.container) {
        obj.system.dynamic = {
          ...obj.system.dynamic,
          items: (obj.system.items ?? []).map((id) => this.actor.items.get(id)?.toObject(false)).filter(Boolean),
        };
      }
      return obj;
    });

    context.localizedType = `TYPES.${this.actor.documentName}.${this.actor.type}`;

    return context;
  }

  _onSubmitForm(formConfig, event) {
    // Check if the document exists before ProseMirror tries to save a deleted document.
    if (!this.document.collection?.has(this.document.id)) return;
    return super._onSubmitForm(formConfig, event);
  }

  getItem(event) {
    return this.actor.items.get(this.getItemId(event));
  }

  getItemId(event) {
    return event.target.closest(".item")?.dataset.itemId;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    if (!this.isEditable) return;

    this.element.querySelectorAll(".item-create").forEach((el) => el.addEventListener("click", this._onItemCreate.bind(this)));
    this.element.querySelectorAll(".item-edit").forEach((el) => el.addEventListener("click", this._onItemEdit.bind(this)));
    this.element.querySelectorAll(".item-delete").forEach((el) => el.addEventListener("click", this._onItemDelete.bind(this)));
    this.element.querySelectorAll(".item-qty-plus").forEach((el) => el.addEventListener("click", this._onItemAddQuantity.bind(this)));
    this.element.querySelectorAll(".item-qty-minus").forEach((el) => el.addEventListener("click", this._onItemSubtractQuantity.bind(this)));
    this.element.querySelectorAll(".individual-initiative-button").forEach((el) => el.addEventListener("click", this._onIndividualInitiativeRoll.bind(this)));

    this.element.querySelectorAll(".effect-create").forEach((el) => el.addEventListener("click", this._onEffectCreate.bind(this)));
    this.element.querySelectorAll(".effect-edit").forEach((el) => el.addEventListener("click", this._onEffectEdit.bind(this)));
    this.element.querySelectorAll(".effect-delete").forEach((el) => el.addEventListener("click", this._onEffectDelete.bind(this)));
    this.element.querySelectorAll(".effect-toggle").forEach((el) => el.addEventListener("click", this._onEffectToggle.bind(this)));
    this.element.querySelectorAll(".effect-select").forEach((el) => el.addEventListener("change", this._onEffectSelect.bind(this)));
  }

  async _onEffectCreate(ev) {
    const type = ev.currentTarget.dataset.type;
    const isTemporary = type === "temporary";
    const defaultName = game.i18n.localize("PB.EffectsNew");
    const effectData = { name: defaultName, icon: "icons/svg/aura.svg" };

    const html = await foundry.applications.handlebars.renderTemplate("systems/pirateborg/templates/dialog/quick-effect.html", { isTemporary });

    await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("PB.EffectsQuick") },
      content: html,
      buttons: [
        {
          action: "create",
          label: game.i18n.localize("PB.EffectsCreate"),
          default: true,
          callback: (event, button) => {
            effectData.name = button.form.elements.label.value || defaultName;
            effectData.changes = [buildQuickEffectChange(button.form.elements.key.value, button.form.elements.modifier.value)];
            if (isTemporary) {
              const combatStarted = game.combat?.started;
              effectData.duration = buildEffectDuration({
                rounds: parseInt(button.form.elements.duration.value) || 1,
                startRound: combatStarted ? game.combat.round : undefined,
                startTurn: combatStarted ? game.combat.turn : undefined,
              });
            }
            this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
          },
        },
        {
          action: "skip",
          label: game.i18n.localize("PB.EffectsSkip"),
          callback: () => {
            if (isTemporary) {
              const combatStarted = game.combat?.started;
              effectData.duration = buildEffectDuration({
                rounds: 1,
                startRound: combatStarted ? game.combat.round : undefined,
                startTurn: combatStarted ? game.combat.turn : undefined,
              });
            }
            this.actor.createEmbeddedDocuments("ActiveEffect", [effectData]).then((effect) => effect[0].sheet.render({ force: true }));
          },
        },
      ],
    });
  }

  _onEffectSelect(ev) {
    this.actor.addCondition(ev.currentTarget.value);
  }

  _onEffectEdit(ev) {
    const id = ev.currentTarget.closest(".item")?.dataset.effectId;
    let effect = this.actor.effects.get(id);
    if (!effect) {
      effect = this.actor.items.find((item) => item.effects.has(id))?.effects.get(id);
      if (!effect) {
        ui.notifications.error(`${game.i18n.localize("PB.EffectsNotFound")}: ${id}`);
        return;
      }
    }
    effect.sheet.render({ force: true });
  }

  _onEffectDelete(ev) {
    const id = ev.currentTarget.closest(".item")?.dataset.effectId;
    let parent = this.actor;
    let effect = parent.effects.get(id);
    if (!effect) {
      effect = parent.items.find((item) => item.effects.has(id))?.effects.get(id);
      if (!effect) {
        ui.notifications.error(`${game.i18n.localize("PB.EffectsNotFound")}: ${id}`);
        return;
      }
      parent = effect.parent;
    }
    parent.deleteEmbeddedDocuments("ActiveEffect", [id]);
  }

  _onEffectToggle(ev) {
    const id = ev.currentTarget.closest(".item")?.dataset.effectId;
    let effect = this.actor.effects.get(id);
    if (!effect) {
      effect = this.actor.items.find((item) => item.effects.has(id))?.effects.get(id);
      if (!effect) {
        ui.notifications.error(`${game.i18n.localize("PB.EffectsNotFound")}: ${id}`);
        return;
      }
    }
    effect.update({ disabled: !effect.disabled });
  }

  async _onItemEdit(event) {
    event.preventDefault();
    this.getItem(event)?.sheet.render({ force: true });
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const { name, type } = await showAddItemDialog();
    await this.actor.createEmbeddedDocuments("Item", [{ name, type }]);
  }

  async _onItemDelete(event) {
    event.preventDefault();
    const item = this.getItem(event);
    if (!item) return;
    const canDelete = item.isContainer && item.hasItems ? await this._confirmItemDelete() : true;
    if (canDelete) await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
  }

  async _confirmItemDelete() {
    return foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("PB.ItemDelete") },
      content: `<p>${game.i18n.localize("PB.ItemDeleteMessage")}</p>`,
      yes: { default: false },
      no: { default: true },
    });
  }

  async _onItemAddQuantity(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await item?.setQuantity(item.quantity + 1);
  }

  async _onItemSubtractQuantity(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await item?.setQuantity(Math.max(1, item.quantity - 1));
  }

  async _onIndividualInitiativeRoll(event) {
    event.preventDefault();
    await actorInitiativeAction(this.actor);
  }

  async _onRevealSecret(event) {
    if (await super._onRevealSecret(event)) return true;
    const secretBlock = event?.target?.closest?.("secret-block") ?? event?.target;
    const target =
      secretBlock?.closest?.("[data-target]")?.dataset?.target ??
      secretBlock?.closest?.("prose-mirror")?.dataset?.target ??
      secretBlock?.closest?.("prose-mirror")?.getAttribute?.("name");
    if (!target || typeof secretBlock?.toggleRevealed !== "function") return false;
    const content = foundry.utils.getProperty(this.actor, target);
    const modified = secretBlock.toggleRevealed(content ?? "");
    await this.actor.update({ [target]: modified });
    return true;
  }

  async _onDropItem(event, itemData) {
    if (itemData.parent?.uuid === this.actor.uuid) return super._onDropItem(event, itemData);
    const item = await super._onDropItem(event, itemData);
    if (!item) return null;

    const { item: originalItem, actor: originalActor } = await getInfoFromDropData(itemData);
    const target = this.getItem(event);
    const isContainer = originalItem?.isContainer;

    await this._cleanDroppedItem(item);

    if (isContainer) {
      await item.clearItems();
      const newItems = await this.actor.createEmbeddedDocuments(
        "Item",
        originalItem.items.map((itemId) => originalActor.items.get(itemId)?.toObject(false)).filter(Boolean),
      );
      await this._addItemsToItemContainer(newItems, item);
    }

    if (item.type === CONFIG.PB.itemTypes.background) {
      const additionalItems = [].concat(
        (await findStartingBonusItems([item])).map((i) => i.toObject()),
        (await findStartingBonusRollsItems([item])).map((i) => i.toObject()),
      );
      if (additionalItems.length > 0) await this.actor.createEmbeddedDocuments("Item", additionalItems);
    }

    if (originalItem) await originalActor.deleteEmbeddedDocuments("Item", [originalItem.id]);
    if (target) await this._handleDropOnItemContainer(item, target);
    return item;
  }

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

  async _cleanDroppedItem(item) {
    if (item.equipped) await item.unequip();
    if (!item.carried) await item.carry();
  }

  async _handleDropOnItemContainer(item, target) {
    if (!item.isContainerizable) return;
    if (target.isContainer) {
      await this._addItemsToItemContainer([item], target);
    } else if (target.hasContainer) {
      await this._addItemsToItemContainer([item], target.container);
    } else {
      await this._removeItemFromItemContainer(item);
    }
  }

  async _addItemsToItemContainer(items, container) {
    for (const item of items) {
      if (item.container && container.id !== item.container.id) await item.container.removeItem(item.id);
      if (item.equipped) await item.unequip();
      await container.addItem(item.id);
    }
  }

  async _removeItemFromItemContainer(item) {
    if (item.container) await item.container.removeItem(item.id);
  }
}
