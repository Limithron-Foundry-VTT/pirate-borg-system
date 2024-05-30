import { findClassPacks } from "../api/compendium.js";
import { isCharacterGeneratorClassAllowed, setAllowedCharacterGeneratorClasses } from "../system/settings.js";

export class AllowedCharacterClassesDialog extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "allowed-character-generator-classes-dialog",
      title: game.i18n.localize("PB.AllowedCharacterGeneratorClassesEdit"),
      template: "systems/pirateborg/templates/dialog/allowed-character-generator-classes-dialog.html",
      classes: ["form", "pirateborg"],
      popOut: true,
      width: 420,
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".toggle-all").on("click", (event) => this._onToggleAll(event));
    html.find(".toggle-none").on("click", (event) => this._onToggleNone(event));
    html.find(".cancel-button").on("click", (event) => this._onCancel(event));
    html.find(".ok-button").on("click", (event) => this._onOk(event));
  }

  getData(options = {}) {
    return foundry.utils.mergeObject(super.getData(options), {
      classes: this._getAllowedClasses(),
    });
  }

  _getAllowedClasses() {
    const classPacks = findClassPacks();
    return classPacks
      .map((classPack) => ({
        name: classPack,
        label: classPack.split("class-")[1].replace(/-/g, " "),
        checked: isCharacterGeneratorClassAllowed(classPack),
      }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }

  _onToggleAll(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".allowed-character-generator-classes-dialog")[0];
    $(form).find(".class-checkbox").prop("checked", true);
  }

  _onToggleNone(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".allowed-character-generator-classes-dialog")[0];
    $(form).find(".class-checkbox").prop("checked", false);
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  _onOk(event) {
    const form = $(event.currentTarget).parents(".allowed-character-generator-classes-dialog")[0];
    const selected = [];
    $(form)
      .find("input:checked")
      .each(function () {
        selected.push($(this).attr("name"));
      });

    if (selected.length === 0) {
      event.preventDefault();
    }
  }

  /** @override */
  async _updateObject(event, formData) {
    await setAllowedCharacterGeneratorClasses(formData);
  }
}
