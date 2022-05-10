import PBActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class PBActorSheetVehicle extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "actor", "container"],
      template: "systems/pirateborg/templates/actor/container-sheet.html",
      width: 720,
      height: 680,
      scrollY: [".tab"],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "contents",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  async getData() {
    const superData = super.getData();
    superData.config = CONFIG.PB;
    superData.data = this._prepareItems(data);
    return superData;
  }

  /**
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {Object}
   */
   _prepareItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const items = {};
    items.equipment = sheetData.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !item.data.hasContainer)
      .sort(byName);

    return items;
  }
}
