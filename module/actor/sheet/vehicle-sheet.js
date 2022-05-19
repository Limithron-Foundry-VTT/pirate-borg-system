import { rollIndividualInitiative } from "../../system/combat.js";
import PBActorSheet from "./actor-sheet.js";
import { PBActorSheetVehicleEdit } from "./vehicle-edit-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class PBActorSheetVehicle extends PBActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "actor", "vehicle", "character"],
      template: "systems/pirateborg/templates/actor/vehicle-sheet.html",
      width: 560,
      height: 680,
      scrollY: [".tab"],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  _getHeaderButtons() {
    return [this._getHeaderEditButton(), ...super._getHeaderButtons()];
  }

  _getHeaderEditButton() {
    return {
      class: `vehicle-edit-dialog-button-${this.actor.id}`,
      label: game.i18n.localize("PB.EditButton"),
      icon: "fas fa-edit",
      onclick: this._onEditSheet.bind(this),
    };
  }

  async _onEditSheet() {
    await this.close();
    const sheet = new PBActorSheetVehicleEdit(this.actor);
    sheet.render(true);
  }

  /** @override */
  async getData() {
    const superData = super.getData();
    superData.config = CONFIG.PB;
    superData.data.data = {
      ...superData.data.data,
      ...(await this._prepareItems(superData.data)),
    };
    superData.data.data.hasCrew = !!this.actor.crews.length;
    return superData;
  }

  async _prepareItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const items = {};

    items.cargos = sheetData.items.filter((item) => item.type === CONFIG.PB.itemTypes.cargo).sort(byName);

    items.features = sheetData.items.filter((item) => item.type === CONFIG.PB.itemTypes.feature).sort(byName);

    items.mysticShanties = sheetData.items.filter((item) => item.type === CONFIG.PB.itemTypes.shanty).sort(byName);

    items.crews = (sheetData.data.crews || []).map((actorId) => {
      const actorData = game.actors.get(actorId);
      if (actorData) {
        actorData.data.data.isCaptain = this.actor.captain === actorId;
      }
      return actorData.data || { _id: actorId, name: "<Deleted Character>", type: "character" };
    });

    items.equipment = sheetData.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !(item.type === CONFIG.PB.itemTypes.invokable && !item.data.isEquipment))
      .filter((item) => !item.data.hasContainer)
      .sort(byName);

    return items;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;

    html.find(".ability-label.rollable.skill").on("click", this._onSkillRoll.bind(this));

    html.find(".ability-label.rollable.agility").on("click", this._onAgilityRoll.bind(this));

    html.find(".tier-radio").click(this._onArmorTierRadio.bind(this));

    html.find(".initiative-button").on("click", this._onInitiativeRoll.bind(this));

    html.find(".sinking-button").on("click", this._onSinking.bind(this));

    html.find(".action-shanties").on("click", this._onActionShanties.bind(this));

    html.find(".item-create-cargo-button").on("click", this._onCreateCargo.bind(this));

    html.find(".item-remove-crew").on("click", this._onRemoveCrew.bind(this));

    html.find(".item-crew-captain").on("click", this._onSetCaptain.bind(this));

    html.find(".mystic-shanties-roll-button").on("click", this._onRollMysticShanties.bind(this));

    html.find(".item-type-character .item-edit").on("click", this._onCrewClick.bind(this));

    html.find(".item-type-creature .item-edit").on("click", this._onCrewClick.bind(this));

    html.find(".rotate-left").on("click", this._onRotateLeft.bind(this));

    html.find(".rotate-right").on("click", this._onRotateRight.bind(this));

    html.find(".action-pc-action").on("click", this._onPCAction.bind(this));

    html.find(".action-crew-action").on("click", this._onCrewAction.bind(this));
  }

  _getItemId(event) {
    return $(event.currentTarget).parents(".item").data("itemId");
  }

  _getCrewAction(event) {
    return $(event.currentTarget).data("action");
  }

  async _crewAction(action, isPCAction = false) {
    switch (action) {
      case "broadsides":
        await this.actor.doBroadsidesAction(isPCAction);
        break;
      case "small-arms":
        await this.actor.doSmallArmsAction(isPCAction);
        break;
      case "ram":
        await this.actor.doRamAction();
        break;
      case "full-sail":
        await this.actor.doFullSailAction(isPCAction);
        break;
      case "come-about":
        await this.actor.doComeAboutAction(isPCAction);
        break;
      case "drop-anchor":
        await this.actor.doDropAnchorAction();
        break;
      case "weigh-anchor":
        await this.actor.doWeighAnchorAction();
        break;
      case "repair":
        await this.actor.doRepairAction(isPCAction);
        break;
      case "boarding-party":
        await this.actor.doBoardingPartyAction();
        break;
    }
  }

  async _onPCAction(event) {
    const action = this._getCrewAction(event);
    await this._crewAction(action, true);
  }

  async _onCrewAction(event) {
    const action = this._getCrewAction(event);
    await this._crewAction(action);
  }

  async _onRotateLeft(event) {
    event.preventDefault();
    await this.actor.rotateToken(-60);
  }

  async _onRotateRight(event) {
    event.preventDefault();
    await this.actor.rotateToken(60);
  }

  _onCrewClick(event) {
    event.preventDefault();
    game.actors.get(this._getItemId(event)).sheet.render(true);
  }

  _onSkillRoll(event) {
    event.preventDefault();
    this.actor.testShipSkill();
  }

  _onAgilityRoll(event) {
    event.preventDefault();
    this.actor.testShipAgility();
  }

  async _onInitiativeRoll(event) {
    event.preventDefault();
    rollIndividualInitiative(this.actor);
  }

  async _onRemoveCrew(event) {
    event.preventDefault();
    await this.actor.removeCrew(this._getItemId(event));
  }

  async _onSetCaptain(event) {
    event.preventDefault();
    await this.actor.setCaptain(this._getItemId(event));
  }

  async _onArmorTierRadio(event) {
    event.preventDefault();
    await this.actor.update({ "data.hull.value": parseInt($(event.currentTarget)[0].value) });
  }

  async _onActionShanties(event) {
    event.preventDefault();
    await this.actor.invokeShanties(this.actor.items.get(this._getItemId(event)));
  }

  async _onRollMysticShanties(event) {
    event.preventDefault();
    await this.actor.rollMysticShantiesPerDay();
  }

  async _onCreateCargo() {
    const itemData = {
      name: game.i18n.localize("PB.ShipCargo"),
      type: CONFIG.PB.itemTypes.cargo,
      data: {},
    };
    await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  async _onSinking() {
    await this.actor.rollShipSink();
  }

  async _onDropActor(event, actorData) {
    const actor = game.actors.get(actorData.id);
    if (["character", "creature"].includes(actor.type)) {
      await this.actor.addCrew(actor.id);
      if (!this.actor.captain) {
        await this.actor.setCaptain(actor.id);
      }
    }
  }
}
