import {
  actorInitiativeAction,
  shipBoardingPartyAction,
  shipBroadsidesAction,
  shipComeAboutAction,
  shipDropAnchorAction,
  shipFullSailAction,
  shipInvokeShantyAction,
  shipRamAction,
  shipRepairAction,
  shipRollAgilityAction,
  shipRollSkillAction,
  shipRotateAction,
  shipShantiesPerDayAction,
  shipSinkAction,
  shipSmallArmsAction,
  shipWeighAnchorAction,
} from "../../api/action/actions.js";
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
      width: 540,
      height: 650,
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

  /**
   * @private
   */
  async _onEditSheet() {
    await this.close();
    const sheet = new PBActorSheetVehicleEdit(this.actor);
    sheet.render(true);
  }

  /** @override */
  async getData(options) {
    const formData = super.getData(options);
    formData.data.system.dynamic = {
      ...(formData.data.system.dynamic ?? {}),
      hasCrew: !!this.actor.crews.length,
      ...(await this._prepareItems(formData)),
    };

    console.log(formData);

    return formData;
  }

  /**
   * @param {Object} sheetData
   * @private
   */
  async _prepareItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const data = {};

    data.cargos = sheetData.data.items.filter((item) => item.type === CONFIG.PB.itemTypes.cargo).sort(byName);

    data.features = sheetData.data.items.filter((item) => item.type === CONFIG.PB.itemTypes.feature).sort(byName);

    data.mysticShanties = sheetData.data.items.filter((item) => item.type === CONFIG.PB.itemTypes.shanty).sort(byName);

    data.crews = [];
    for (const actorId of sheetData.data.system.crews || []) {
      const actor = game.actors.get(actorId);
      const actorData = actor ? (await actor.sheet.getData()).data : null;
      if (actorData) {
        actorData.system.isCaptain = this.actor.captain === actorId;
      }
      data.crews.push(
        actorData || {
          _id: actorId,
          name: "<Deleted Character>",
          type: "character",
        }
      );
    }

    data.equipment = sheetData.data.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !(item.type === CONFIG.PB.itemTypes.invokable && !item.system.isEquipment))
      .filter((item) => !item.system.hasContainer)
      .sort(byName);

    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;

    this.bindSelectorsEvent("click", {
      ".ability-label.rollable.skill": this._onSkillRoll,
      ".ability-label.rollable.agility": this._onAgilityRoll,
      ".tier-radio": this._onArmorTierRadio,
      ".initiative-button": this._onInitiativeRoll,
      ".sinking-button": this._onSinking,
      ".action-shanties": this._onActionShanties,
      ".item-create-cargo-button": this._onCreateCargo,
      ".item-remove-crew": this._onRemoveCrew,
      ".item-crew-captain": this._onSetCaptain,
      ".mystic-shanties-roll-button": this._onRollMysticShanties,
      ".item-type-character .item-edit": this._onCrewClick,
      ".item-type-creature .item-edit": this._onCrewClick,

      ".rotate-left": this._onRotateLeft,
      ".rotate-right": this._onRotateRight,
      ".action-pc-action": this._onPCAction,
      ".action-crew-action": this._onCrewAction,
    });
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  _getCrewAction(event) {
    return $(event.currentTarget).data("action");
  }

  async _crewAction(action, isPCAction = false) {
    switch (action) {
      case "broadsides":
        await shipBroadsidesAction(this.actor, isPCAction);
        break;
      case "small-arms":
        await shipSmallArmsAction(this.actor, isPCAction);
        break;
      case "ram":
        await shipRamAction(this.actor);
        break;
      case "full-sail":
        await shipFullSailAction(this.actor, isPCAction);
        break;
      case "come-about":
        await shipComeAboutAction(this.actor, isPCAction);
        break;
      case "drop-anchor":
        await shipDropAnchorAction(this.actor);
        break;
      case "weigh-anchor":
        await shipWeighAnchorAction(this.actor);
        break;
      case "repair":
        await shipRepairAction(this.actor, isPCAction);
        break;
      case "boarding-party":
        await shipBoardingPartyAction(this.actor);
        break;
    }
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onPCAction(event) {
    const action = this._getCrewAction(event);
    await this._crewAction(action, true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onCrewAction(event) {
    const action = this._getCrewAction(event);
    await this._crewAction(action);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onRotateLeft(event) {
    event.preventDefault();
    await shipRotateAction(this.actor, -60);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onRotateRight(event) {
    event.preventDefault();
    await shipRotateAction(this.actor, 60);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  _onCrewClick(event) {
    event.preventDefault();
    game.actors.get(this.getItemId(event)).sheet.render(true);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onSkillRoll(event) {
    event.preventDefault();
    await shipRollSkillAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onAgilityRoll(event) {
    event.preventDefault();
    await shipRollAgilityAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onInitiativeRoll(event) {
    event.preventDefault();
    await actorInitiativeAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onRemoveCrew(event) {
    event.preventDefault();
    await this.actor.removeCrew(this.getItemId(event));
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onSetCaptain(event) {
    event.preventDefault();
    const captainId = this.getItemId(event);
    if (this.actor.captain === captainId) {
      await this.actor.setCaptain(null);
    } else {
      await this.actor.setCaptain(captainId);
    }
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onArmorTierRadio(event) {
    event.preventDefault();
    await this.actor.updateData("attributes.hull.value", parseInt($(event.currentTarget)[0].value));
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onActionShanties(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await shipInvokeShantyAction(this.actor, item);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onRollMysticShanties(event) {
    event.preventDefault();
    await shipShantiesPerDayAction(this.actor);
  }

  /**
   * @private
   */
  async _onCreateCargo() {
    const itemData = {
      name: game.i18n.localize("PB.ShipCargo"),
      type: CONFIG.PB.itemTypes.cargo,
      data: {},
    };
    await this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * @private
   */
  async _onSinking() {
    await shipSinkAction(this.actor);
  }

  /**
   * @param {DragEvent} event
   * @param {ActorSheet.DropData.Actor} actorData
   * @private
   */
  async _onDropActor(event, actorData) {
    const actorFromUuid = actorData.uuid ? await fromUuid(actorData.uuid) : null;
    const actor = actorFromUuid
      ? actorFromUuid
      : actorData.sceneId
      ? game.scenes.get(actorData.sceneId).tokens.get(actorData.tokenId).actor
      : game.actors.get(actorData.actorId);

    if (["character", "creature"].includes(actor.type)) {
      await this.actor.addCrew(actor.id);
      if (!this.actor.captain) {
        await this.actor.setCaptain(actor.id);
      }
    }
  }
}
