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
  async getData(options) {
    const formData = super.getData(options);

    formData.data.system.dynamic = {
      ...(formData.data.system.dynamic ?? {}),
      ...(await this._prepareItems(formData))
    };

    console.log(formData);
    return formData;
  }

  /**
   *
   * @param {ActorSheet.Data} formData
   *
   * @return {Object}
   */
  async _prepareItems(formData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const data = {};

    data.equipment = formData.data.items.filter((item) => !item.system.hasContainer).sort(byName);

    return data;
  }
}
