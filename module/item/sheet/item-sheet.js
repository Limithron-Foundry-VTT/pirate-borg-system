import { PB } from "../../config.js";
import { showAnimationDialog } from "../../dialog/animation-dialog.js";
import { configureEditor } from "../../system/configure-editor.js";

/*
 * @extends {ItemSheet}
 */
export class PBItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "item"],
      width: 500,
      height: 500,
      scrollY: [".tab"],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
      dragDrop: [
        { dropSelector: 'textarea[name="data.startingBonusItems"]' },
        { dropSelector: 'textarea[name="data.startingBonusRolls"]' },
        { dropSelector: 'input[name="data.startingMacro"]' },
      ],
    });
  }

  /** @override */
  get template() {
    const path = "systems/pirateborg/templates/item";
    if (Object.keys(PB.itemTypeKeys).includes(this.item.data.type)) {
      return `${path}/${this.item.data.type}-sheet.html`;
    }
    return `${path}/item-sheet.html`;
  }

  /** @override */
  _getHeaderButtons() {
    return [this._getHeaderAnimationButton(), ...super._getHeaderButtons()];
  }

  _getHeaderAnimationButton() {
    return {
      class: `vehicle-edit-dialog-button-${this.actor.id}`,
      label: game.i18n.localize("PB.EditAnimation"),
      icon: "fas fa-edit",
      onclick: this._onEditAnimation.bind(this),
    };
  }

  /** @override */
  async getData(options) {
    const data = super.getData(options);
    data.config = CONFIG.PB;
    return data;
  }

  /** @override */
  async _updateObject(event, formData) {
    if (this.object.type === CONFIG.PB.itemTypes.weapon) {
      // Ensure weapons that need reloading have a reloading time
      if (formData["data.needsReloading"] && (!formData["data.reloadTime"] || formData["data.reloadTime"] < 0)) {
        formData["data.reloadTime"] = 1;
      }
    }

    return super._updateObject(event, formData);
  }

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /** @override */
  activateEditor(name, options = {}, initialContent = "") {
    configureEditor(options);
    super.activateEditor(name, options, initialContent);
  }

  _onEditAnimation(event) {
    showAnimationDialog({ entity: this.item });
  }

  /** @inheritdoc */
  async _onDrop(event) {
    if (!this.options.editable) return;

    let data;
    try {
      data = JSON.parse(event?.dataTransfer?.getData("text/plain"));
    } catch (err) {
      return;
    }

    if (!data?.pack || !data?.id) {
      ui.notifications.error(game.i18n.localize("PB.StartingBonusDropInvalid"));
      return;
    }

    if (
      (event.target?.name === "data.startingBonusItems" && data?.type !== "Item") ||
      (event.target?.name === "data.startingBonusRolls" && data?.type !== "RollTable")
    ) {
      return;
    }

    const item = await fromUuid(`Compendium.${data.pack}.${data.id}`);
    if (!item) {
      return;
    }

    let content = event.target.value ? "\n" : "";
    let droppedValue = `${data.pack};${item.name}`;
    if (data.type === "RollTable") {
      droppedValue += `;1`;
    }
    content += droppedValue;
    event.target.value += content;
  }
}
