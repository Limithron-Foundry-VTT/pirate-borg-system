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
  async getData(options) {
    const formData = super.getData(options);

    formData.data.system.dynamic = {
      ...(formData.data.system.dynamic ?? {}),
      ...(await this._prepareItems(formData)),
    };

    console.log(formData);
    return formData;
  }

  /**
   * @param {Object} formData
   */
  async _prepareItems(formData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    const data = {};

    data.equipment = formData.data.items
      .filter((item) => CONFIG.PB.itemEquipmentTypes.includes(item.type))
      .filter((item) => !item.system.hasContainer)
      .sort(byName);

    return data;
  }
}
