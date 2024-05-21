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
        { dropSelector: 'textarea[name="system.startingBonusItems"]' },
        { dropSelector: 'textarea[name="system.startingBonusRolls"]' },
        { dropSelector: 'input[name="system.startingMacro"]' },
      ],
    });
  }

  activateListeners(html) {
    super.activateListeners(html)
    
    html.find(".effect-create").click(async ev => {
      if (this.item.isOwned)
        ui.notifications.error("Effects can only be added to world items or actors directly")
      let effectData = { label: this.item.name, icon: this.item.img }

        let html = await renderTemplate("systems/pirateborg/templates/dialog/quick-effect.html", effectData)
        let dialog = new Dialog({
            title : "Quick Effect",
            content : html,
            buttons : {
                "create" : {
                    label : "Create",
                    callback : html => {
                        let mode = 2
                        let label = html.find(".label").val()
                        let key = html.find(".key").val()
                        let value = parseInt(html.find(".modifier").val())
                        effectData.name = label
                        effectData.changes = [{key, mode, value}]
                        this.object.createEmbeddedDocuments("ActiveEffect", [effectData])
                    }
                },
                "skip" : {
                    label : "Skip",
                    callback : () => this.object.createEmbeddedDocuments("ActiveEffect", [effectData]).then(effect => effect[0].sheet.render(true))
                }
            }
        })
        await dialog._render(true)
        dialog._element.find(".label").select()

    })

    html.find(".effect-edit").click(ev => {
      let id = $(ev.currentTarget).parents(".item").attr("data-effect-id")
      this.object.effects.get(id).sheet.render(true)
    })

    html.find(".effect-delete").click(ev => {
      let id = $(ev.currentTarget).parents(".item").attr("data-effect-id")
      this.object.deleteEmbeddedDocuments("ActiveEffect", [id])
    })
  }
  /** @override */
  get template() {
    const path = "systems/pirateborg/templates/item";
    if (Object.keys(PB.itemTypeKeys).includes(this.item.type)) {
      return `${path}/${this.item.type}-sheet.html`;
    }
    return `${path}/item-sheet.html`;
  }

  /** @override */
  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    if (this.item.isWeapon) {
      return [this._getHeaderAnimationButton(), ...buttons];
    }
    return buttons;
  }

  _getHeaderAnimationButton() {
    return {
      class: `edit-animation-dialog-button-${this.item.id}`,
      label: game.i18n.localize("PB.EditAnimation"),
      icon: "fas fa-edit",
      onclick: this._onEditAnimation.bind(this),
    };
  }

  /** @override */
  async getData(options) {
    const formData = super.getData(options);
    formData.config = CONFIG.PB;
    if (!this.item.system) {
      formData.data.system = formData.data.data;
      delete formData.data.data;
    }
    return formData;
  }

  /** @override */
  async _updateObject(event, formData) {
    // V10
    if (!this.item.system) {
      formData = Object.keys(formData).reduce((data, key) => {
        data[key.replace("system.", "data.")] = formData[key];
        return data;
      }, {});
    }

    if (this.object.type === CONFIG.PB.itemTypes.weapon) {
      // Ensure weapons that need reloading have a reloading time
      if (formData["system.needsReloading"] && (!formData["system.reloadTime"] || formData["system.reloadTime"] < 0)) {
        formData["system.reloadTime"] = 1;
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

  async _onEditAnimation() {
    await showAnimationDialog(this.item);
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
      (event.target?.name === "system.startingBonusItems" && data?.type !== "Item") ||
      (event.target?.name === "system.startingBonusRolls" && data?.type !== "RollTable")
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
