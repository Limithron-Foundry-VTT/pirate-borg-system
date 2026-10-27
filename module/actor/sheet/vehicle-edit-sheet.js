import PBActorSheet from "./actor-sheet.js";
import { PBActorSheetVehicle } from "./vehicle-sheet.js";

export class PBActorSheetVehicleEdit extends PBActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["pirateborg", "sheet", "actor", "vehicle-edit"],
    position: { width: 500, height: 650 },
    form: {
      handler: PBActorSheetVehicleEdit.#onSubmitForm,
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      controls: [
        {
          action: "standardSheet",
          icon: "fas fa-eye",
          label: "PB.ViewButton",
        },
      ],
    },
    actions: {
      standardSheet: PBActorSheetVehicleEdit.#onStandardSheet,
    },
  };

  static PARTS = {
    main: {
      template: "systems/pirateborg/templates/actor/vehicle-edit-sheet.html",
      scrollable: [".tab"],
    },
  };

  static TABS = {
    sheet: {
      tabs: [
        { id: "description", group: "sheet", label: "PB.TabDescription" },
        { id: "items", group: "sheet", label: "PB.TabEquipment" },
        { id: "data", group: "sheet", label: "PB.TabDetails" },
        { id: "effects", group: "sheet", label: "PB.TabEffects" },
      ],
      initial: "description",
      labelAttr: "label",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const preparedItems = await this._prepareItems(context);
    context.data.system.dynamic = {
      ...(context.data.system.dynamic ?? {}),
      ...preparedItems,
    };
    return context;
  }

  async _prepareItems(context) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    return {
      equipment: context.items.filter((item) => !item.system.hasContainer).sort(byName),
    };
  }

  static async #onSubmitForm(event, form, formData) {
    await this.actor.update(formData.object);
  }

  static async #onStandardSheet() {
    await this.close();
    const sheet = new PBActorSheetVehicle(this.actor);
    sheet.render({ force: true });
  }
}
