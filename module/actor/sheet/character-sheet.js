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
import CharacterGeneratorDialog from "../../dialog/character-generator-dialog.js";
import ActorBaseClassDialog from "../../dialog/actor-base-class-dialog.js";

/**
 * @extends {ActorSheet}
 */
export class PBActorSheetCharacter extends PBActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "actor", "character"],
      template: "systems/pirateborg/templates/actor/character-sheet.html",
      width: 600,
      height: 600,
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
  async getData() {
    const superData = await super.getData();
    const { data } = superData;
    data.config = CONFIG.PB;

    for (const [a, abl] of Object.entries(data.data.abilities)) {
      const translationKey = CONFIG.PB.abilities[a];
      abl.label = game.i18n.localize(translationKey);
    }

    await this._prepareCharacterData(data);

    console.log(superData.data);
    return superData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} sheetData The sheet data to prepare.
   * @return {Promise}
   */
  async _prepareCharacterData(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const byType = (a, b) => (a.type.toLowerCase() > b.type.toLowerCase() ? 1 : b.type.toLowerCase() > a.type.toLowerCase() ? -1 : 0);
    const groupByType = (items, item) => {
      const key = item.data.featureType || item.data.invokableType || item.type;
      let group = items.find((i) => i.type === key);
      if (!group) {
        group = { type: key, items: [] };
        items.push(group);
      }
      group.items.push(item);
      return items;
    };
    sheetData.data.dynamic.class = this.actor.getCharacterClass();

    sheetData.data.dynamic.equipment = sheetData.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !(item.type === CONFIG.PB.itemTypes.invokable && !item.data.isEquipment))
      .filter((item) => !item.data.hasContainer)
      .sort(byName);

    sheetData.data.dynamic.equippedArmor = sheetData.items.filter((item) => item.type === CONFIG.PB.itemTypes.armor).find((item) => item.data.equipped);

    sheetData.data.dynamic.equippedHat = sheetData.items.filter((item) => item.type === CONFIG.PB.itemTypes.hat).find((item) => item.data.equipped);

    sheetData.data.dynamic.equippedWeapons = sheetData.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.weapon)
      .filter((item) => item.data.equipped)
      .sort(byName);

    for (const weapon of sheetData.data.dynamic.equippedWeapons) {
      if (weapon.data.needsReloading && weapon.data.reloadTime) {
        weapon.data.loadingStatus = weapon.data.reloadTime - (weapon.data.loadingCount || 0);
      }
    }

    sheetData.data.dynamic.ammo = sheetData.items.filter((item) => item.type === CONFIG.PB.itemTypes.ammo).sort(byName);

    sheetData.data.dynamic.features = sheetData.items
      .filter((item) => [CONFIG.PB.itemTypes.feature, CONFIG.PB.itemTypes.background, CONFIG.PB.itemTypes.invokable].includes(item.type))
      .filter((item) => !["Arcane Ritual", "Ancient Relic"].includes(item.data.invokableType))
      .reduce(groupByType, [])
      .sort(byType);

    sheetData.data.dynamic.invokables = sheetData.items
      .filter((item) => [CONFIG.PB.itemTypes.invokable].includes(item.type))
      .filter((item) => ["Arcane Ritual", "Ancient Relic"].includes(item.data.invokableType))
      .reduce(groupByType, [])
      .sort(byType);

    sheetData.data.dynamic.useExtraResource =
      sheetData.data.dynamic.class?.data?.data?.useExtraResource || sheetData.data.dynamic.baseClass?.data?.useExtraResource;
    sheetData.data.dynamic.extraResourceNamePlural =
      sheetData.data.dynamic.class?.data?.data?.extraResourceNamePlural || sheetData.data.dynamic.baseClass?.data?.extraResourceNamePlural;
    sheetData.data.dynamic.extraResourceFormulaLabel =
      sheetData.data.dynamic.class?.data?.data?.extraResourceFormulaLabel || sheetData.data.dynamic.baseClass?.data?.extraResourceFormulaLabel;
    sheetData.data.dynamic.luckDie = sheetData.data.dynamic.class?.data?.data?.luckDie || sheetData.data.dynamic.baseClass?.data?.luckDie;
    sheetData.data.dynamic.trackCarryingCapacity = trackCarryingCapacity();
    sheetData.data.dynamic.trackAmmo = trackAmmo();
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
    (await this.actor.getCharacterBaseClassItem()).sheet.render(true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onClassItem(event) {
    event.preventDefault();
    (await this.actor.getCharacterClass()).sheet.render(true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onPartyInitiativeRoll(event) {
    event.preventDefault();
    actorPartyInitiativeAction();
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
  _onArmorTierRadio(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    const item = this.getItem(event);
    item.setTier({ value: parseInt(input[0].value, 10) });
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
    new CharacterGeneratorDialog(this.actor).render(true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  _onBaseClass(event) {
    event.preventDefault();
    new ActorBaseClassDialog(this.actor).render(true);
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
    // confirm before doing get better
    const d = new Dialog({
      title: game.i18n.localize("PB.GetBetter"),
      content:
        "<p>The game master decides when a character should be improved.</p><p>It might be after: a raid, acquiring treasure, dividing the plunder, burying treasure, or acquiring a new ship</p>",
      buttons: {
        cancel: {
          label: game.i18n.localize("PB.Cancel"),
        },
        getbetter: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("PB.GetBetter"),
          callback: async () => await characterGetBetterAction(this.actor),
        },
      },
      default: "cancel",
    });
    d.render(true);
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
  _onActionMacroRoll(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const li = button.parents(".item");
    const itemId = li.data("item-id");
    this.actor.useActionMacro(itemId);
  }

  /**
   * @private
   */
  async _onLuckLabel() {
    await ChatMessage.create({
      content: await renderTemplate("systems/pirateborg/templates/chat/devil-luck-information-card.html"),
    });
  }
}
