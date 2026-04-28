import { PB } from "../../config.js";
import { showAnimationDialog } from "../../dialog/animation-dialog.js";
import { configureEditor } from "../../system/configure-editor.js";
import { bindProseMirrorDescriptionEditor, getCachedEditorDraft } from "../../system/prosemirror-editor-state.js";
import PBActorSheet from "../../actor/sheet/actor-sheet.js";

/*
 * @extends {ItemSheet}
 */
export class PBItemSheet extends (foundry.appv1?.sheets?.ItemSheet ?? ItemSheet) {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
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

  /** @override */
  async _onRevealSecret(event) {
    if (super._onRevealSecret(event)) return true;

    const secretBlock = event?.target?.closest?.("secret-block") ?? event?.target;
    const target =
      secretBlock?.closest?.("[data-target]")?.dataset?.target ??
      secretBlock?.closest?.("prose-mirror")?.dataset?.target ??
      secretBlock?.closest?.("prose-mirror")?.getAttribute?.("name");
    if (!target || typeof secretBlock?.toggleRevealed !== "function") return false;

    const document = this.document ?? this.item;
    const content = foundry.utils.getProperty(document, target);
    const modified = secretBlock.toggleRevealed(content ?? "");
    await document.update({ [target]: modified });
    return true;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Handle ProseMirror editor toggle (v13+)
    if (game.release.generation >= 13) {
      bindProseMirrorDescriptionEditor(this, html);
    }

    html.find(".effect-create").click(async () => {
      const effectData = {
        name: "",
        label: this.item.name,
        icon: this.item.img,
        origin: this.item.uuid,
      };

      const template = "systems/pirateborg/templates/dialog/quick-effect.html";
      let html;
      if (game.release.generation >= 13) {
        html = await foundry.applications.handlebars.renderTemplate(template, effectData);
      } else {
        html = await renderTemplate(template, effectData);
      }
      const dialog = new Dialog({
        title: game.i18n.localize("PB.EffectsQuick"),
        content: html,
        buttons: {
          create: {
            label: game.i18n.localize("PB.EffectsCreate"),
            callback: (html) => {
              effectData.name = html.find(".label").val();
              effectData.changes = [
                {
                  key: html.find(".key").val(),
                  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                  value: parseInt(html.find(".modifier").val()),
                },
              ];
              this.object.createEmbeddedDocuments("ActiveEffect", [effectData]);
            },
          },
          skip: {
            label: game.i18n.localize("PB.EffectsSkip"),
            callback: () => {
              effectData.name = game.i18n.localize("PB.EffectsNew");
              this.object.createEmbeddedDocuments("ActiveEffect", [effectData]).then((effect) => effect[0].sheet.render(true));
            },
          },
        },
      });
      await dialog._render(true);
      dialog._element.find(".label").select();
    });

    html.find(".effect-edit").click((ev) => {
      const id = $(ev.currentTarget).parents(".item").attr("data-effect-id");
      this.object.effects.get(id).sheet.render(true);
    });

    html.find(".effect-delete").click((ev) => {
      const id = $(ev.currentTarget).parents(".item").attr("data-effect-id");
      this.object.deleteEmbeddedDocuments("ActiveEffect", [id]);
    });
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
    if (this.item.isWeapon && typeof Sequencer !== "undefined") {
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

    // Ensure editable flag is available for templates
    formData.editable = this.isEditable;

    // Editor data for v13+ ProseMirror
    formData.descriptionSource = formData.data.system.description || "";
    formData.documentUuid = this.item.uuid;

    // Check if we're in editing mode
    if (this._editingDescriptionTarget) {
      const draft = getCachedEditorDraft(this, this._editingDescriptionTarget, formData.data.system.description || "");
      formData.editingDescription = {
        target: this._editingDescriptionTarget,
        value: draft,
      };
    }

    formData.descriptionHTML = formData.data.system.description
      ? await (game.release.generation >= 13 ? foundry.applications.ux.TextEditor.implementation : TextEditor).enrichHTML(formData.data.system.description, {
          secrets: this.item.isOwner,
          relativeTo: this.item,
          rollData: this.item.getRollData?.() ?? {},
        })
      : "";

    formData.item.effects?.map(PBActorSheet.addModifierDisplay);

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
