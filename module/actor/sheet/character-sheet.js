import PBActorSheet from "./actor-sheet.js";
import RestDialog from "../../dialog/rest-dialog.js";
import { trackAmmo, trackCarryingCapacity } from "../../system/settings.js";

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
    const data = superData.data;
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

    sheetData.data.dynamic.baseClass = (await this.actor.getCharacterBaseClass())?.data;
    sheetData.data.dynamic.useExtraResource = sheetData.data.dynamic.class?.data?.data?.useExtraResource || sheetData.data.dynamic.baseClass?.data?.useExtraResource;
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

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // sheet header
    html.find(".ability-label.rollable.strength").on("click", this._onStrengthRoll.bind(this));
    html.find(".ability-label.rollable.agility").on("click", this._onAgilityRoll.bind(this));
    html.find(".ability-label.rollable.presence").on("click", this._onPresenceRoll.bind(this));
    html.find(".ability-label.rollable.toughness").on("click", this._onToughnessRoll.bind(this));
    html.find(".ability-label.rollable.spirit").on("click", this._onSpiritRoll.bind(this));

    html.find(".broken-button").on("click", this._onBroken.bind(this));
    html.find(".rest-button").on("click", this._onRest.bind(this));
    html.find(".luck-rule").on("click", this._onLuckRoll.bind(this));
    html.find(".luck-label").on("click", this._onLuckLabel.bind(this));

    html.find(".get-better-button").on("click", this._onGetBetter.bind(this));

    // feats tab
    html.find(".action-macro-button").on("click", this._onActionMacroRoll.bind(this));
    html.find(".action-invokable").on("click", this._onActionInvokable.bind(this));

    html.find(".ritual-per-day-text").on("click", this._onRitualPerDay.bind(this));
    html.find(".extra-resources-per-day-text").on("click", this._onExtraResourcePerDay.bind(this));

    html.find("select.ammo-select").on("change", this._onAmmoSelect.bind(this));

    html.find(".item-base-class").on("click", async () => {
      (await this.actor.getCharacterBaseClass()).sheet.render(true);
    });
    html.find(".item-class").on("click", async () => {
      (await this.actor.getCharacterClass()).sheet.render(true);
    });
  }

  _onStrengthRoll(event) {
    event.preventDefault();
    this.actor.testStrength();
  }

  _onAgilityRoll(event) {
    event.preventDefault();
    this.actor.testAgility();
  }

  _onPresenceRoll(event) {
    event.preventDefault();
    this.actor.testPresence();
  }

  _onToughnessRoll(event) {
    event.preventDefault();
    this.actor.testToughness();
  }

  _onSpiritRoll(event) {
    event.preventDefault();
    this.actor.testSpirit();
  }

  _onLuckRoll(event) {
    event.preventDefault();
    this.actor.rollLuck();
  }

  _onPowersPerDayRoll(event) {
    event.preventDefault();
    this.actor.rollPowersPerDay();
  }

  _onRegenerateCharacter(event) {
    event.preventDefault();
    this.actor.regenerateCharacter();
  }

  _onBaseClass(event) {
    event.preventDefault();
    this.actor.showBaseClassDialog();
  }

  _onBroken(event) {
    event.preventDefault();
    this.actor.rollBroken();
  }

  _onRest(event) {
    event.preventDefault();
    const restDialog = new RestDialog();
    // TODO: maybe move this into a constructor,
    // if we can resolve the mergeObject() Maximum call stack size exceeded error
    restDialog.actor = this.actor;
    restDialog.render(true);
  }

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
          callback: () => this.actor.getBetter(),
        },
      },
      default: "cancel",
    });
    d.render(true);
  }

  _onRitualPerDay() {
    event.preventDefault();
    this.actor.rollRitualPerDay();
  }

  _onExtraResourcePerDay() {
    event.preventDefault();
    this.actor.rollExtraResourcePerDay();
  }

  _onActionInvokable(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const li = button.parents(".item");
    const itemId = li.data("item-id");
    this.actor.invokeInvokable(itemId);
  }

  _onActionMacroRoll(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const li = button.parents(".item");
    const itemId = li.data("item-id");
    this.actor.useActionMacro(itemId);
  }

  async _onLuckLabel() {
    await ChatMessage.create({
      content: await renderTemplate("systems/pirateborg/templates/chat/devil-luck-information-card.html"),
    });
  }
}
