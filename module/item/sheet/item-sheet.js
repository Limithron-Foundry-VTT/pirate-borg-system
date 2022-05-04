import { PB } from "../../config.js";
import * as editor from "../../system/configure-editor.js";

/*
 * @extends {ItemSheet}
 */
export class PBItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "item"],
      width: 600,
      height: 560,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
      dragDrop: [{ dropSelector: 'textarea[name="data.startingBonusItems"]' }],
    });
  }

  /** @override */
  get template() {
    const path = "systems/pirateborg/templates/item";
    if (Object.keys(PB.itemTypeKeys).includes(this.item.data.type)) {
      // specific item-type sheet
      return `${path}/${this.item.data.type}-sheet.html`;
    } else {
      // generic item sheet
      return `${path}/item-sheet.html`;
    }
  }

  /** @override */
  async getData(options) {
    const data = super.getData(options);
    data.config = CONFIG.PB;
    // TODO
    /*if (data.data.data.scrollType) {
      data.data.data.localizedScrollType = game.i18n.localize(
        PB.scrollTypes[data.data.data.scrollType]
      );
    }*/
    return data;
  }

  /**
   *  This is a small override to handle remembering the sheet's position.
   *  @override
   */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
  }

  /** @override */
  activateEditor(name, options = {}, initialContent = "") {
    editor.setCustomEditorOptions(options);
    super.activateEditor(name, options, initialContent);
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

    if (data?.type !== "Item" || !data?.id) {
      return;
    }

    if (!data?.pack) {
      ui.notifications.error(game.i18n.localize("PB.StartingBonusItemInvalid"));
      return;
    }

    const item = await fromUuid(`Compendium.${data.pack}.${data.id}`);
    if (!item) {
      return;
    }

    let content = event.target.value ? "\n" : "";
    content += `${data.pack};${item.name}`;
    event.target.value += content;
  }
}
