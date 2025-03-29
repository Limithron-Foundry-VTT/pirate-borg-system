import PBActorSheet from "./actor-sheet.js";
import { trackAmmo, trackCarryingCapacity } from "../../system/settings.js";
import {
  actorPartyInitiativeAction,
  characterAttackAction,
  characterBrokenAction,
  characterDefendAction,
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
} from "../../api/action/actions.js";
import { showCharacterGeneratorDialog } from "../../dialog/character-generator-dialog.js";
import { showActorBaseClassDialog } from "../../dialog/actor-base-class-dialog.js";
import { characterUseItemAction } from "../../api/action/character/character-use-item-action.js";

/**
 * @extends {ActorSheet}
 */
export class PBActorSheetCharacter extends PBActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "actor", "character"],
      template: "systems/pirateborg/templates/actor/character-sheet.html",
      width: 600,
      height: 700,
      scrollY: [".tab"],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "combat",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  _getHeaderButtons() {
    return [
      {
        class: `actor-base-class-dialog-button-${this.actor.id}`,
        label: game.i18n.localize("PB.BaseClass"),
        icon: "fas fa-cog",
        onclick: this._onBaseClass.bind(this),
      },
      {
        class: `regenerate-character-button-${this.actor.id}`,
        label: game.i18n.localize("PB.RegenerateCharacter"),
        icon: "fas fa-skull",
        onclick: this._onRegenerateCharacter.bind(this),
      },
      ...super._getHeaderButtons(),
    ];
  }

  /** @override */
  async getData(options) {
    const formData = await super.getData(options);
    formData.data.system.dynamic = {
      ...(formData.data.system.dynamic ?? {}),
      ...(await this._prepareItems(formData)),
    };

    console.log(formData);

    return formData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} sheetData The sheet data to prepare.
   * @return {Promise}
   */
  async _prepareItems(sheetData) {
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

    data.equipment = sheetData.data.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !(item.type === CONFIG.PB.itemTypes.invokable && !item.system.isEquipment))
      .filter((item) => !item.system.hasContainer)
      .sort(byName);

    data.equippedArmor = sheetData.data.items.filter((item) => item.type === CONFIG.PB.itemTypes.armor).find((item) => item.system.equipped);

    data.equippedHat = sheetData.data.items.filter((item) => item.type === CONFIG.PB.itemTypes.hat).find((item) => item.system.equipped);

    data.equippedWeapons = sheetData.data.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.weapon)
      .filter((item) => item.system.equipped)
      .sort(byName);

    for (const weapon of data.equippedWeapons) {
      if (weapon.system.needsReloading && weapon.system.reloadTime) {
        weapon.system.loadingStatus = weapon.system.reloadTime - (weapon.system.loadingCount || 0);
      }
    }

    data.ammo = sheetData.data.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.ammo)
      .sort(byName)
      .map((i) => ({ ...i, fullName: `${i.name} (${i.system.quantity})` }));

    data.features = sheetData.data.items
      .filter((item) => [CONFIG.PB.itemTypes.feature, CONFIG.PB.itemTypes.background, CONFIG.PB.itemTypes.invokable].includes(item.type))
      .filter((item) => !["Arcane Ritual", "Ancient Relic"].includes(item.system.invokableType))
      .reduce(groupByType, [])
      .sort(byType);

    data.invokables = sheetData.data.items
      .filter((item) => [CONFIG.PB.itemTypes.invokable].includes(item.type))
      .filter((item) => ["Arcane Ritual", "Ancient Relic"].includes(item.system.invokableType))
      .reduce(groupByType, [])
      .sort(byType);

    data.trackCarryingCapacity = trackCarryingCapacity();
    data.trackAmmo = trackAmmo();

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;

    this.bindSelectorsEvent("click", {
      ".item-toggle-equipped": this._onToggleEquippedItem,
      ".item-toggle-carried": this._onToggleCarriedItem,
      ".ability-label.rollable.strength": this._onStrengthRoll,
      ".ability-label.rollable.agility": this._onAgilityRoll,
      ".ability-label.rollable.presence": this._onPresenceRoll,
      ".ability-label.rollable.toughness": this._onToughnessRoll,
      ".ability-label.rollable.spirit": this._onSpiritRoll,
      ".party-initiative-button": this._onPartyInitiativeRoll,
      ".attack-button": this._onAttackRoll,
      ".reload-button": this._onReload,
      ".defend-button": this._onDefendRoll,
      ".tier-radio": this._onArmorTierRadio,
      ".broken-button": this._onBroken,
      ".rest-button": this._onRest,
      ".luck-rule": this._onLuckRoll,
      ".luck-label": this._onLuckLabel,
      ".get-better-button": this._onGetBetter,
      ".action-macro-button": this._onActionMacroRoll,
      ".action-invokable": this._onActionInvokable,
      ".ritual-per-day-text": this._onRitualPerDay,
      ".extra-resources-per-day-text": this._onExtraResourcePerDay,
      ".item-base-class": this._onBaseClassItem,
      ".item-class": this._onClassItem,
    });

    this.bindSelectorsEvent("change", {
      "select.ammo-select": this._onAmmoSelect,
    });
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onBaseClassItem(event) {
    event.preventDefault();
    this.actor.characterBaseClass.sheet.render(true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onClassItem(event) {
    event.preventDefault();
    this.actor.characterClass.sheet.render(true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onPartyInitiativeRoll(event) {
    event.preventDefault();
    await actorPartyInitiativeAction();
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onAttackRoll(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await characterAttackAction(this.actor, item);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onArmorTierRadio(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    const item = this.getItem(event);
    await item.setTier({ value: parseInt(input[0].value, 10) });
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onDefendRoll(event) {
    event.preventDefault();
    await characterDefendAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onReload(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await characterReloadAction(this.actor, item);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onToggleEquippedItem(event) {
    event.preventDefault();
    const item = this.getItem(event);

    if (item.equipped) {
      await this.actor.unequipItem(item);
    } else {
      await this.actor.equipItem(item);
    }
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onToggleCarriedItem(event) {
    event.preventDefault();
    const item = this.getItem(event);
    if (item.carried) {
      await item.drop();
    } else {
      await item.carry();
    }
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onAmmoSelect(event) {
    event.preventDefault();
    const select = $(event.currentTarget);
    const weapon = this.getItem(event);
    if (weapon) {
      await weapon.setAmmoId(select.val());
    }
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onStrengthRoll(event) {
    event.preventDefault();
    await characterRollStrengthAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onAgilityRoll(event) {
    event.preventDefault();
    await characterRollAgilityAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onPresenceRoll(event) {
    event.preventDefault();
    await characterRollPresenceAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onToughnessRoll(event) {
    event.preventDefault();
    await characterRollToughnessAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onSpiritRoll(event) {
    event.preventDefault();
    await characterRollSpiritAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onLuckRoll(event) {
    event.preventDefault();
    await characterLuckPerDayAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  _onRegenerateCharacter(event) {
    event.preventDefault();
    showCharacterGeneratorDialog(this.actor);

    //new CharacterGeneratorDialog(this.actor).render(true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  _onBaseClass(event) {
    event.preventDefault();
    showActorBaseClassDialog(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onBroken(event) {
    event.preventDefault();
    await characterBrokenAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onRest(event) {
    event.preventDefault();
    await characterRestAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  _onGetBetter(event) {
    event.preventDefault();
    const getingBetterConfirmDialog = new Dialog(
      {
        title: game.i18n.localize("PB.GetBetter"),
        content: game.i18n.localize("PB.GetBetterConfirmMessage"),
        buttons: {
          cancel: {
            label: game.i18n.localize("PB.Cancel"),
          },
          getbetter: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize("PB.GetBetter"),
            callback: async () => characterGetBetterAction(this.actor),
          },
        },
        default: "cancel",
      },
      { classes: ["dialog", "custom-dialog"] }
    );
    getingBetterConfirmDialog.render(true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onRitualPerDay(event) {
    event.preventDefault();
    await characterRitualsPerDayAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onExtraResourcePerDay(event) {
    event.preventDefault();
    await characterExtraResourcePerDayAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
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

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onActionMacroRoll(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await characterUseItemAction(this.actor, item);
  }

  /**
   * @private
   */
  async _onLuckLabel() {
    const template = "systems/pirateborg/templates/chat/devil-luck-information-card.html";
    let html;
    if (game.release.generation >= 13) {
      html = await foundry.applications.handlebars.renderTemplate(template);
    } else {
      html = await renderTemplate(template);
    }
    await ChatMessage.create({
      content: html,
    });
  }
}
