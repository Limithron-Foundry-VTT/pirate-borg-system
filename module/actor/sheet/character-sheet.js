import PBActorSheet from "./actor-sheet.js";
import RestDialog from "./rest-dialog.js";
import { trackAmmo, trackCarryingCapacity } from "../../settings.js";

/**
 * @extends {ActorSheet}
 */
export class PBActorSheetCharacter extends PBActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "actor", "character"],
      template: "systems/pirateborg/templates/actor/character-sheet.html",
      width: 750,
      height: 690,
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
        class: `regenerate-character-button-${this.actor.id}`,
        label: game.i18n.localize("PB.RegenerateCharacter"),
        icon: "fas fa-skull",
        onclick: this._onScvmify.bind(this),
      },  
      ...super._getHeaderButtons()
    ];
  }

  /** @override */
  getData() {
    const superData = super.getData();
    const data = superData.data;
    data.config = CONFIG.PB;

    // Ability Scores
    for (const [a, abl] of Object.entries(data.data.abilities)) {
      const translationKey = CONFIG.PB.abilities[a];
      abl.label = game.i18n.localize(translationKey);
    }

    // Prepare items.
    if (this.actor.data.type == "character") {
      this._prepareCharacterItems(data);
    }

    data.data.trackCarryingCapacity = trackCarryingCapacity();
    data.data.trackAmmo = trackAmmo();

    return superData;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} sheetData The sheet data to prepare.
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const byType = (a, b) => (a.type.toLowerCase() > b.type.toLowerCase() ? 1 : b.type.toLowerCase() > a.type.toLowerCase() ? -1 : 0)

    sheetData.data.class = sheetData.items.find(
      (item) => item.type === CONFIG.PB.itemTypes.class
    );

    sheetData.data.equipment = sheetData.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !(item.type === CONFIG.PB.itemTypes.invokable && !item.data.isEquipment))
      .filter((item) => !item.data.hasContainer)
      .sort(byName);

    sheetData.data.equippedArmor = sheetData.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.armor)
      .find((item) => item.data.equipped);

    sheetData.data.equippedHat = sheetData.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.hat)
      .find((item) => item.data.equipped);

    sheetData.data.equippedWeapons = sheetData.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.weapon)
      .filter((item) => item.data.equipped)
      .sort(byName);

    sheetData.data.ammo = sheetData.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.ammo)
      .sort(byName);

    sheetData.data.features = sheetData.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.feature || item.type === CONFIG.PB.itemTypes.background || item.type === CONFIG.PB.itemTypes.invokable)
      .filter((item) => !(item.data.invokableType === 'Arcane Ritual' || item.data.invokableType === 'Ancient Relic'))
      .reduce((items, item) => {
        const key = item.data.featureType || item.data.invokableType || item.type;        
        let group = items.find((i) => i.type === key);
        if (!group) {
          group = { type: key, items: []}
          items.push(group);
        }
        group.items.push(item)
        return items;
      }, [])
      .sort(byType);

      sheetData.data.invokables = sheetData.items
      .filter((item) => item.type === CONFIG.PB.itemTypes.invokable)
      .filter((item) => item.data.invokableType === 'Arcane Ritual' || item.data.invokableType === 'Ancient Relic')
      .reduce((items, item) => {
        const key = item.data.invokableType;        
        let group = items.find((i) => i.type === key);
        if (!group) {
          group = { type: key, items: []}
          items.push(group);
        }
        group.items.push(item)
        return items;
      }, [])
      .sort(byType);

      console.log(sheetData.data);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // sheet header
    html
      .find(".ability-label.rollable.strength")
      .on("click", this._onStrengthRoll.bind(this));
    html
      .find(".ability-label.rollable.agility")
      .on("click", this._onAgilityRoll.bind(this));
    html
      .find(".ability-label.rollable.presence")
      .on("click", this._onPresenceRoll.bind(this));
    html
      .find(".ability-label.rollable.toughness")
      .on("click", this._onToughnessRoll.bind(this));
      html
      .find(".ability-label.rollable.spirit")
      .on("click", this._onSpiritRoll.bind(this));      

    html.find(".broken-button").on("click", this._onBroken.bind(this));
    html.find(".rest-button").on("click", this._onRest.bind(this));
    html.find(".luck-row span.rollable").on("click", this._onLuckRoll.bind(this));

    html.find(".get-better-button").on("click", this._onGetBetter.bind(this));

    // feats tab
    html.find(".action-macro-button").on("click", this._onActionMacroRoll.bind(this));
    html.find(".action-invokable").on("click", this._onActionInvokable.bind(this));

    html.find(".ritual-per-day-text").on("click", this._onRitualPerDay.bind(this));
    html.find(".extra-resources-per-day-text").on("click", this._onExtraResourcePerDay.bind(this));  

    html.find("select.ammo-select").on("change", this._onAmmoSelect.bind(this));
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

  _onScvmify(event) {
    event.preventDefault();
    this.actor.scvmify();
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
}
