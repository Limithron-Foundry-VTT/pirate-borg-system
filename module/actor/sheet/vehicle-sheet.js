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

export class PBActorSheetVehicle extends PBActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["pirateborg", "sheet", "actor", "vehicle", "character"],
    position: { width: 540, height: 650 },
    dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    form: {
      handler: PBActorSheetVehicle.#onSubmitForm,
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      controls: [
        {
          action: "editSheet",
          icon: "fas fa-edit",
          label: "PB.EditButton",
        },
      ],
    },
    actions: {
      editSheet: PBActorSheetVehicle.#onEditSheet,
    },
  };

  static PARTS = {
    main: {
      template: "systems/pirateborg/templates/actor/vehicle-sheet.html",
      scrollable: [".sheet-body"],
    },
  };

  static TABS = {
    sheet: {
      tabs: [
        { id: "combat", group: "sheet", label: "PB.TabCombat" },
        { id: "effects", group: "sheet", label: "PB.TabEffects" },
      ],
      initial: "combat",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const preparedItems = await this._prepareItems(context);
    context.data.system.dynamic = {
      ...(context.data.system.dynamic ?? {}),
      hasCrew: !!this.actor.crews.length,
      ...preparedItems,
    };
    return context;
  }

  async _prepareItems(context) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const data = {};

    data.cargos = context.items.filter((item) => item.type === CONFIG.PB.itemTypes.cargo).sort(byName);
    data.features = context.items.filter((item) => item.type === CONFIG.PB.itemTypes.feature).sort(byName);
    data.mysticShanties = context.items.filter((item) => item.type === CONFIG.PB.itemTypes.shanty).sort(byName);

    data.crews = [];
    for (const actorId of this.actor.system.crews || []) {
      const actor = game.actors.get(actorId);
      const actorData = actor ? actor.toObject(false) : null;
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

    data.equipment = context.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !(item.type === CONFIG.PB.itemTypes.invokable && !item.system.isEquipment))
      .filter((item) => !item.system.hasContainer)
      .sort(byName);

    return data;
  }

  _onRender() {
    super._onRender();
    if (!this.isEditable) return;

    [
      [".ability-label.rollable.skill", "click", this._onSkillRoll],
      [".ability-label.rollable.agility", "click", this._onAgilityRoll],
      [".tier-radio", "click", this._onArmorTierRadio],
      [".initiative-button", "click", this._onInitiativeRoll],
      [".sinking-button", "click", this._onSinking],
      [".action-shanties", "click", this._onActionShanties],
      [".item-create-cargo-button", "click", this._onCreateCargo],
      [".item-remove-crew", "click", this._onRemoveCrew],
      [".item-crew-captain", "click", this._onSetCaptain],
      [".mystic-shanties-roll-button", "click", this._onRollMysticShanties],
      [".item-type-character .item-edit", "click", this._onCrewClick],
      [".item-type-creature .item-edit", "click", this._onCrewClick],
      [".rotate-left", "click", this._onRotateLeft],
      [".rotate-right", "click", this._onRotateRight],
      [".action-pc-action", "click", this._onPCAction],
      [".action-crew-action", "click", this._onCrewAction],
    ].forEach(([selector, event, handler]) => {
      this.element.querySelectorAll(selector).forEach((el) => el.addEventListener(event, handler.bind(this)));
    });
  }

  static async #onSubmitForm(event, form, formData) {
    await this.actor.update(formData.object);
  }

  static async #onEditSheet() {
    await this.close();
    const sheet = new PBActorSheetVehicleEdit(this.actor);
    sheet.render({ force: true });
  }

  _getCrewAction(event) {
    return event.currentTarget.dataset.action;
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
    await shipRotateAction(this.actor, -60);
  }

  async _onRotateRight(event) {
    event.preventDefault();
    await shipRotateAction(this.actor, 60);
  }

  _onCrewClick(event) {
    event.preventDefault();
    game.actors.get(this.getItemId(event)).sheet.render({ force: true });
  }

  async _onSkillRoll(event) {
    event.preventDefault();
    await shipRollSkillAction(this.actor);
  }

  async _onAgilityRoll(event) {
    event.preventDefault();
    await shipRollAgilityAction(this.actor);
  }

  async _onInitiativeRoll(event) {
    event.preventDefault();
    await actorInitiativeAction(this.actor);
  }

  async _onRemoveCrew(event) {
    event.preventDefault();
    await this.actor.removeCrew(this.getItemId(event));
  }

  async _onSetCaptain(event) {
    event.preventDefault();
    const captainId = this.getItemId(event);
    if (this.actor.captain === captainId) {
      await this.actor.setCaptain(null);
    } else {
      await this.actor.setCaptain(captainId);
    }
  }

  async _onArmorTierRadio(event) {
    event.preventDefault();
    await this.actor.updateData("attributes.hull.value", parseInt(event.currentTarget.value, 10));
  }

  async _onActionShanties(event) {
    event.preventDefault();
    const item = this.getItem(event);
    await shipInvokeShantyAction(this.actor, item);
  }

  async _onRollMysticShanties(event) {
    event.preventDefault();
    await shipShantiesPerDayAction(this.actor);
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
    await shipSinkAction(this.actor);
  }

  async _onDropActor(event, actorData) {
    const actorFromUuid = actorData.uuid ? await fromUuid(actorData.uuid) : null;
    const actor = actorFromUuid ? actorFromUuid : game.actors.get(actorData.id);

    if (["character", "creature"].includes(actor.type)) {
      await this.actor.addCrew(actor.id);
      if (!this.actor.captain) {
        await this.actor.setCaptain(actor.id);
      }
    }
  }
}
