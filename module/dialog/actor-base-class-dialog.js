import { classItemFromPack, findClassPacks } from "../compendium.js";
import { isCharacterGeneratorClassAllowed } from "../system/settings.js";

export default class ActorBaseClassDialog extends Application {
  constructor(actor = null, options = {}) {
    super(options);
    this.actor = actor;
  }

  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "actor-base-class-dialog";
    options.classes = ["pirateborg"];
    options.title = game.i18n.localize("PB.BaseClass");
    options.template = "systems/pirateborg/templates/dialog/actor-base-class-dialog.html";
    options.width = 420;
    options.height = "auto";
    return options;
  }

  /** @override */
  async getData(options = {}) {
    return mergeObject(super.getData(options), {
      classes: await this.getClassData(),
      requireBaseClass: this.actor.getCharacterClass().getData().requireBaseClass,
    });
  }

  async getClassData() {
    return (await this.getClasses(findClassPacks()))
      .filter((clazz) => !clazz.getData().requireBaseClass)
      .filter((clazz) => isCharacterGeneratorClassAllowed(clazz.data.name))
      .map((clazz) => ({
        name: clazz.name,
        baseClass: `${clazz.pack};${clazz.name}`,
        selected: `${clazz.pack};${clazz.name}` === this.actor.getData().baseClass ? "selected" : "",
      }))
      .sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  async getClasses(classPacks) {
    const classses = [];
    for (const classPack of classPacks) {
      const clazz = await classItemFromPack(classPack);
      if (clazz) {
        classses.push(clazz);
      }
    }
    return classses;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".cancel-button").click(this._onCancel.bind(this));
    html.find(".ok-button").click(this._onOk.bind(this));
  }

  _onCancel(event) {
    event.preventDefault();
    this.close();
  }

  async _onOk(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents("form")[0];
    const baseClass = $(form).find("#baseClass");
    await this.actor.setBaseCharacterClass(baseClass.val());
    this.close();
  }
}
