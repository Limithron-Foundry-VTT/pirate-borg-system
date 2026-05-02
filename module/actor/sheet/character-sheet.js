import PBActorSheet from "./actor-sheet.js";
import { trackAmmo, trackCarryingCapacity, isGrogEnabled } from "../../system/settings.js";
import {
  actorPartyInitiativeAction,
  characterAttackAction,
  characterBrokenAction,
  characterDefendAction,
  characterDrinkGrogAction,
  characterExtraResourcePerDayAction,
  characterGetBetterAction,
  characterInvokeExtraResourceAction,
  characterInvokeRelicAction,
  characterInvokeRitualAction,
  characterLuckPerDayAction,
  characterReloadAction,
  characterRestAction,
  characterRitualsPerDayAction,
  characterRollAgilityAction,
  characterRollPresenceAction,
  characterRollSpiritAction,
  characterRollStrengthAction,
  characterRollToughnessAction,
  characterShowDevilLuckAction,
} from "../../api/action/actions.js";
import { showCharacterGeneratorDialog } from "../../dialog/character-generator-dialog.js";
import { showActorBaseClassDialog } from "../../dialog/actor-base-class-dialog.js";
import { characterUseItemAction } from "../../api/action/character/character-use-item-action.js";

export class PBActorSheetCharacter extends PBActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["pirateborg", "sheet", "actor", "character"],
    position: { width: 600, height: 700 },
    dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    form: {
      handler: PBActorSheetCharacter.#onSubmitForm,
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      controls: [
        {
          action: "baseClass",
          icon: "fas fa-cog",
          label: "PB.BaseClass",
        },
        {
          action: "regenerateCharacter",
          icon: "fas fa-skull",
          label: "PB.RegenerateCharacter",
        },
      ],
    },
    actions: {
      baseClass: PBActorSheetCharacter.#onBaseClass,
      regenerateCharacter: PBActorSheetCharacter.#onRegenerateCharacter,
    },
  };

  static PARTS = {
    main: {
      template: "systems/pirateborg/templates/actor/character-sheet.html",
      scrollable: [".tab"],
    },
  };

  static TABS = {
    sheet: {
      tabs: [
        { id: "combat", group: "sheet", label: "PB.TabCombat" },
        { id: "powers", group: "sheet", label: "PB.Powers" },
        { id: "equipment", group: "sheet", label: "PB.TabEquipment" },
        { id: "features", group: "sheet", label: "PB.TabFeatures" },
        { id: "history", group: "sheet", label: "PB.TabHistory" },
        { id: "effects", group: "sheet", label: "PB.TabEffects" },
      ],
      initial: "combat",
      labelAttr: "label",
    },
  };

  async _onDragStart(event) {
    if (event.currentTarget.classList.contains("defend-button")) {
      const dragData = {
        type: "Action",
        action: "defend",
        actorId: this.actor.id,
        sceneId: this.token?.parent?.id ?? null,
        tokenId: this.token?.id ?? null,
      };
      event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
      return;
    }
    return super._onDragStart(event);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const preparedItems = await this._prepareItems(context);
    context.data.system.dynamic = {
      ...(context.data.system.dynamic ?? {}),
      ...preparedItems,
    };
    context.effectiveSpeed = (this.actor.system.attributes.speed.max || 0) + (this.actor.system.attributes.combat.speedModifier || 0);
    return context;
  }

  async _prepareItems(context) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const byType = (a, b) => (a.type.toLowerCase() > b.type.toLowerCase() ? 1 : b.type.toLowerCase() > a.type.toLowerCase() ? -1 : 0);
    const groupByType = (items, item) => {
      const key = item.system.featureType || item.system.invokableType || item.type;
      let group = items.find((i) => i.type === key);
      if (!group) {
        group = { type: key, items: [] };
        items.push(group);
      }
      group.items.push(item);
      return items;
    };

    const data = {};

    data.class = this.actor.characterClass?.toObject(false);
    data.baseClass = this.actor.characterBaseClass?.toObject(false);

    data.equipment = context.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => item.type !== CONFIG.PB.itemTypes.grog)
      .filter((item) => !(item.type === CONFIG.PB.itemTypes.invokable && !item.system.isEquipment))
      .filter((item) => !item.system.hasContainer)
      .sort(byName);

    data.equippedArmor = context.items.filter((item) => item.type === CONFIG.PB.itemTypes.armor).find((item) => item.system.equipped);

    data.equippedHat = context.items.filter((item) => item.type === CONFIG.PB.itemTypes.hat).find((item) => item.system.equipped);

    data.equippedWeapons = context.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.weapon)
      .filter((item) => item.system.equipped)
      .sort(byName);

    for (const weapon of data.equippedWeapons) {
      if (weapon.system.needsReloading && weapon.system.reloadTime) {
        weapon.system.loadingStatus = weapon.system.reloadTime - (weapon.system.loadingCount || 0);
      }
    }

    data.ammo = context.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.ammo)
      .sort(byName)
      .map((i) => ({ ...i, fullName: `${i.name} (${i.system.quantity})` }));

    data.features = context.items
      .filter((item) => [CONFIG.PB.itemTypes.feature, CONFIG.PB.itemTypes.background, CONFIG.PB.itemTypes.invokable].includes(item.type))
      .filter((item) => !["Arcane Ritual", "Ancient Relic"].includes(item.system.invokableType))
      .reduce(groupByType, [])
      .sort(byType);

    data.invokables = context.items
      .filter((item) => [CONFIG.PB.itemTypes.invokable].includes(item.type))
      .filter((item) => ["Arcane Ritual", "Ancient Relic"].includes(item.system.invokableType))
      .reduce(groupByType, [])
      .sort(byType);

    data.trackCarryingCapacity = trackCarryingCapacity();
    data.trackAmmo = trackAmmo();

    data.grog = context.items.filter((item) => item.type === CONFIG.PB.itemTypes.grog).sort(byName);
    data.hasGrog = data.grog.some((item) => item.system.quantity > 0);
    data.grogCount = data.grog.reduce((sum, item) => sum + (item.system.quantity || 0), 0);
    data.grogEnabled = isGrogEnabled();

    return data;
  }

  _onRender() {
    super._onRender();
    if (!this.isEditable) return;

    [
      [".item-toggle-equipped", "click", this._onToggleEquippedItem],
      [".item-toggle-carried", "click", this._onToggleCarriedItem],
      [".ability-label.rollable.strength", "click", this._onStrengthRoll],
      [".ability-label.rollable.agility", "click", this._onAgilityRoll],
      [".ability-label.rollable.presence", "click", this._onPresenceRoll],
      [".ability-label.rollable.toughness", "click", this._onToughnessRoll],
      [".ability-label.rollable.spirit", "click", this._onSpiritRoll],
      [".party-initiative-button", "click", this._onPartyInitiativeRoll],
      [".attack-button", "click", this._onAttackRoll],
      [".reload-button", "click", this._onReload],
      [".defend-button", "click", this._onDefendRoll],
      [".tier-radio", "click", this._onArmorTierRadio],
      [".broken-button", "click", this._onBroken],
      [".rest-button", "click", this._onRest],
      [".luck-rule", "click", this._onLuckRoll],
      [".luck-label", "click", this._onLuckLabel],
      [".get-better-button", "click", this._onGetBetter],
      [".action-macro-button", "click", this._onActionMacroRoll],
      [".action-invokable", "click", this._onActionInvokable],
      [".ritual-per-day-text", "click", this._onRitualPerDay],
      [".extra-resources-per-day-text", "click", this._onExtraResourcePerDay],
      [".item-base-class", "click", this._onBaseClassItem],
      [".item-class", "click", this._onClassItem],
      [".drink-grog-button", "click", this._onDrinkGrog],
      ["select.ammo-select", "change", this._onAmmoSelect],
    ].forEach(([selector, event, handler]) => {
      this.element.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler.bind(this)));
    });
  }

  static async #onSubmitForm(event, form, formData) {
    await this.actor.update(formData.object);
  }

  static #onBaseClass() {
    showActorBaseClassDialog(this.actor);
  }

  static #onRegenerateCharacter() {
    showCharacterGeneratorDialog(this.actor);
  }

  async _onBaseClassItem(event) {
    event.preventDefault();
    this.actor.characterBaseClass.sheet.render({ force: true });
  }

  async _onClassItem(event) {
    event.preventDefault();
    this.actor.characterClass.sheet.render({ force: true });
  }

  async _onPartyInitiativeRoll(event) {
    event.preventDefault();
    await actorPartyInitiativeAction();
  }

  async _onAttackRoll(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await characterAttackAction(this.actor, item);
  }

  async _onArmorTierRadio(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await item.setTier({ value: parseInt(event.currentTarget.value, 10) });
  }

  async _onDefendRoll(event) {
    event.preventDefault();
    await characterDefendAction(this.actor);
  }

  async _onReload(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await characterReloadAction(this.actor, item);
  }

  async _onToggleEquippedItem(event) {
    event.preventDefault();
    const item = this.getItem(event);
    if (item.equipped) {
      await this.actor.unequipItem(item);
    } else {
      await this.actor.equipItem(item);
    }
  }

  async _onToggleCarriedItem(event) {
    event.preventDefault();
    const item = this.getItem(event);
    if (item.carried) {
      await item.drop();
    } else {
      await item.carry();
    }
  }

  async _onAmmoSelect(event) {
    event.preventDefault();
    const weapon = this.getItem(event);
    if (weapon) {
      await weapon.setAmmoId(event.currentTarget.value);
    }
  }

  async _onStrengthRoll(event) {
    event.preventDefault();
    await characterRollStrengthAction(this.actor);
  }

  async _onAgilityRoll(event) {
    event.preventDefault();
    await characterRollAgilityAction(this.actor);
  }

  async _onPresenceRoll(event) {
    event.preventDefault();
    await characterRollPresenceAction(this.actor);
  }

  async _onToughnessRoll(event) {
    event.preventDefault();
    await characterRollToughnessAction(this.actor);
  }

  async _onSpiritRoll(event) {
    event.preventDefault();
    await characterRollSpiritAction(this.actor);
  }

  async _onLuckRoll(event) {
    event.preventDefault();
    await characterLuckPerDayAction(this.actor);
  }

  async _onBroken(event) {
    event.preventDefault();
    await characterBrokenAction(this.actor);
  }

  async _onRest(event) {
    event.preventDefault();
    await characterRestAction(this.actor);
  }

  async _onGetBetter(event) {
    event.preventDefault();
    await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("PB.GetBetter") },
      content: `<p>${game.i18n.localize("PB.GetBetterConfirmMessage")}</p>`,
      buttons: [
        {
          action: "getbetter",
          label: game.i18n.localize("PB.GetBetter"),
          icon: "fas fa-check",
          callback: async () => {
            if (Hooks.call("pirateborg.preCharacterGetBetter", this.actor) === false) return;
            await characterGetBetterAction(this.actor);
          },
        },
        {
          action: "cancel",
          label: game.i18n.localize("PB.Cancel"),
          default: true,
        },
      ],
    });
  }

  async _onRitualPerDay(event) {
    event.preventDefault();
    await characterRitualsPerDayAction(this.actor);
  }

  async _onExtraResourcePerDay(event) {
    event.preventDefault();
    await characterExtraResourcePerDayAction(this.actor);
  }

  async _onActionInvokable(event) {
    event.preventDefault();
    const item = this.getItem(event);
    switch (true) {
      case item.isArcaneRitual:
        await characterInvokeRitualAction(this.actor, item);
        break;
      case item.isAncientRelic:
        await characterInvokeRelicAction(this.actor, item);
        break;
      case item.isExtraResource:
        await characterInvokeExtraResourceAction(this.actor, item);
        break;
    }
  }

  async _onActionMacroRoll(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await characterUseItemAction(this.actor, item);
  }

  async _onLuckLabel() {
    await characterShowDevilLuckAction(this.actor);
  }

  async _onDrinkGrog(event) {
    event.preventDefault();
    await characterDrinkGrogAction(this.actor);
  }
}
