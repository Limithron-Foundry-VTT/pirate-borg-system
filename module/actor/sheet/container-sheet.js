import PBActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class PBActorSheetContainer extends PBActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "actor", "container"],
      template: "systems/pirateborg/templates/actor/container-sheet.html",
      width: 500,
      height: 600,
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

  /**
   * @override
   * @returns {ActorSheet.Data}
   */
  getData(options) {
    const superData = super.getData(options);
    superData.config = CONFIG.PB;
    if (this.actor.data.type === "container") {
      this._prepareContainerItems(superData.data);
    }
    return superData;
  }

  /**
   * @param {Object} sheetData
   */
  _prepareContainerItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);

    sheetData.data.dynamic.equipment = sheetData.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !item.data.hasContainer)
      .sort(byName);
  }
}
