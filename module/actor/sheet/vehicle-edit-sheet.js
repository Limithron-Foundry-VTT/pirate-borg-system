import PBActorSheet from "./actor-sheet.js";
import { PBActorSheetVehicle } from "./vehicle-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class PBActorSheetVehicleEdit extends PBActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "actor", "vehicle-edit"],
      template: "systems/pirateborg/templates/actor/vehicle-edit-sheet.html",
      width: 500,
      height: 650,
      scrollY: [".tab"],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  _getHeaderButtons() {
    return [
      {
        class: `vehicle-dialog-button-${this.actor.id}`,
        label: game.i18n.localize("PB.ViewButton"),
        icon: "fas fa-eye",
        onclick: this._onStandardSheet.bind(this),
      },
      ...super._getHeaderButtons(),
    ];
  }

  async _onStandardSheet() {
    await this.close();
    const sheet = new PBActorSheetVehicle(this.actor);
    sheet.render(true);
  }

  /** @override */
  async getData() {
    const superData = super.getData();
    superData.config = CONFIG.PB;
    superData.data.data = {
      ...superData.data.data,
      dynamic: {
        ...(await this._prepareItems(superData.data)),
      }
    };
    console.log(superData.data);
    return superData;
  }

  /**
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {Object}
   */
  async _prepareItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const items = {};

    items.equipment = sheetData.items.filter((item) => !item.data.hasContainer).sort(byName);

    return items;
  }
}
