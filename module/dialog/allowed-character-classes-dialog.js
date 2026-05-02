import { findClassPacks } from "../api/compendium.js";
import { isCharacterGeneratorClassAllowed, setAllowedCharacterGeneratorClasses } from "../system/settings.js";
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class AllowedCharacterClassesDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "allowed-character-generator-classes-dialog",
    classes: ["form", "pirateborg"],
    window: { title: "PB.AllowedCharacterGeneratorClassesEdit" },
    position: { width: 420 },
    tag: "form",
    form: {
      handler: AllowedCharacterClassesDialog.#onSubmitForm,
      closeOnSubmit: true,
    },
    actions: {
      toggleAll: AllowedCharacterClassesDialog.#onToggleAll,
      toggleNone: AllowedCharacterClassesDialog.#onToggleNone,
      cancel: AllowedCharacterClassesDialog.#onCancel,
    },
  };

  static PARTS = {
    main: {
      template: "systems/pirateborg/templates/dialog/allowed-character-generator-classes-dialog.html",
    },
  };

  async _prepareContext() {
    return { classes: this._getAllowedClasses() };
  }

  _getAllowedClasses() {
    return findClassPacks()
      .map((classPack) => ({
        name: classPack,
        label: classPack.split("class-")[1].replace(/-/g, " "),
        checked: isCharacterGeneratorClassAllowed(classPack),
      }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }

  static #onToggleAll() {
    this.element.querySelectorAll(".class-checkbox").forEach((el) => (el.checked = true));
  }

  static #onToggleNone() {
    this.element.querySelectorAll(".class-checkbox").forEach((el) => (el.checked = false));
  }

  static async #onCancel() {
    await this.close();
  }

  static async #onSubmitForm(event, form, formData) {
    const selected = Object.entries(formData.object)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (selected.length === 0) {
      ui.notifications.warn(game.i18n.localize("PB.AllowedCharacterGeneratorClassesNoneSelected"));
      return;
    }

    await setAllowedCharacterGeneratorClasses(formData.object);
  }
}
