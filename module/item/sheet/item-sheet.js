import { PB } from "../../config.js";
import { showAnimationDialog } from "../../dialog/animation-dialog.js";
import PBActorSheet from "../../actor/sheet/actor-sheet.js";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class PBItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  get item() {
    return this.document;
  }

  static DEFAULT_OPTIONS = {
    classes: ["pirateborg", "sheet", "item"],
    position: { width: 500, height: 500 },
    dragDrop: [
      { dropSelector: 'textarea[name="system.startingBonusItems"]' },
      { dropSelector: 'textarea[name="system.startingBonusRolls"]' },
      { dropSelector: 'input[name="system.startingMacro"]' },
    ],
    form: {
      handler: PBItemSheet.#onSubmitForm,
      submitOnChange: true,
      closeOnSubmit: false,
    },
    window: {
      controls: [
        {
          action: "editAnimation",
          icon: "fas fa-edit",
          label: "PB.EditAnimation",
        },
      ],
    },
    actions: {
      editAnimation: PBItemSheet.#onEditAnimation,
      createEffect: PBItemSheet.#onEffectCreate,
      editEffect: PBItemSheet.#onEffectEdit,
      deleteEffect: PBItemSheet.#onEffectDelete,
    },
  };

  static PARTS = {
    main: {
      template: "systems/pirateborg/templates/item/item-sheet.html",
      scrollable: [".tab"],
    },
  };

  static TABS = {
    sheet: {
      tabs: [
        { id: "description", group: "sheet", label: "PB.TabDescription" },
        { id: "details", group: "sheet", label: "PB.TabDetails" },
        { id: "effects", group: "sheet", label: "PB.TabEffects" },
      ],
      initial: "description",
      labelAttr: "label",
    },
  };

  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    const path = "systems/pirateborg/templates/item";
    parts.main.template = Object.keys(PB.itemTypeKeys).includes(this.item.type) ? `${path}/${this.item.type}-sheet.html` : `${path}/item-sheet.html`;
    return parts;
  }

  _getHeaderControls() {
    const controls = super._getHeaderControls();
    if (!this.item.isWeapon || typeof Sequencer === "undefined") {
      return controls.filter((c) => c.action !== "editAnimation");
    }
    return controls;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.config = CONFIG.PB;
    context.editable = this.isEditable;
    context.data = this.item;

    const system = this.item.system;
    context.descriptionHTML = system.description
      ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(system.description, {
          secrets: this.item.isOwner,
          relativeTo: this.item,
          rollData: this.item.getRollData?.() ?? {},
        })
      : "";

    context.item = this.item;
    context.effects = [...this.item.effects].map(PBActorSheet.addModifierDisplay);

    return context;
  }

  async _onRevealSecret(event) {
    if (await super._onRevealSecret(event)) return true;

    const secretBlock = event?.target?.closest?.("secret-block") ?? event?.target;
    const target = secretBlock?.closest?.("[data-target]")?.dataset?.target ?? secretBlock?.closest?.("prose-mirror")?.getAttribute?.("name");
    if (!target || typeof secretBlock?.toggleRevealed !== "function") return false;

    const content = foundry.utils.getProperty(this.document, target);
    const modified = secretBlock.toggleRevealed(content ?? "");
    await this.document.update({ [target]: modified });
    return true;
  }

  static async #onSubmitForm(event, form, formData) {
    const data = formData.object;

    if (this.item.type === CONFIG.PB.itemTypes.weapon) {
      if (data["system.needsReloading"] && (!data["system.reloadTime"] || data["system.reloadTime"] < 0)) {
        data["system.reloadTime"] = 1;
      }
    }

    await this.item.update(data);
  }

  static async #onEditAnimation() {
    await showAnimationDialog(this.item);
  }

  static async #onEffectCreate() {
    const effectData = {
      name: "",
      label: this.item.name,
      icon: this.item.img,
      origin: this.item.uuid,
      transfer: true,
    };

    const template = "systems/pirateborg/templates/dialog/quick-effect.html";
    const html = await foundry.applications.handlebars.renderTemplate(template, effectData);

    await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("PB.EffectsQuick") },
      content: html,
      buttons: [
        {
          action: "create",
          label: game.i18n.localize("PB.EffectsCreate"),
          default: true,
          callback: (event, button) => {
            effectData.name = button.form.elements.label.value;
            effectData.changes = [
              {
                key: button.form.elements.key.value,
                mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                value: parseInt(button.form.elements.modifier.value),
              },
            ];
            this.item.createEmbeddedDocuments("ActiveEffect", [effectData]);
          },
        },
        {
          action: "skip",
          label: game.i18n.localize("PB.EffectsSkip"),
          callback: () => {
            effectData.name = game.i18n.localize("PB.EffectsNew");
            this.item.createEmbeddedDocuments("ActiveEffect", [effectData]).then((effect) => effect[0].sheet.render({ force: true }));
          },
        },
      ],
    });
  }

  static #onEffectEdit(event, target) {
    const id = target.closest(".item")?.dataset.effectId;
    this.item.effects.get(id)?.sheet.render({ force: true });
  }

  static #onEffectDelete(event, target) {
    const id = target.closest(".item")?.dataset.effectId;
    if (id) this.item.deleteEmbeddedDocuments("ActiveEffect", [id]);
  }

  async _onDrop(event) {
    if (!this.isEditable) return;

    let data;
    try {
      data = JSON.parse(event?.dataTransfer?.getData("text/plain"));
    } catch {
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
    if (!item) return;

    let content = event.target.value ? "\n" : "";
    let droppedValue = `${data.pack};${item.name}`;
    if (data.type === "RollTable") droppedValue += `;1`;
    content += droppedValue;
    event.target.value += content;
  }
}
