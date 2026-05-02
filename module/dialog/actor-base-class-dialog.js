import { classItemFromPack, findClassPacks } from "../api/compendium.js";
import { isCharacterGeneratorClassAllowed } from "../system/settings.js";
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

class ActorBaseClassDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor = null, options = {}) {
    super(options);
    this.actor = actor;
  }

  static DEFAULT_OPTIONS = {
    id: "actor-base-class-dialog",
    classes: ["pirateborg"],
    window: { title: "PB.BaseClass" },
    position: { width: 420, height: "auto" },
  };

  static PARTS = {
    main: { template: "systems/pirateborg/templates/dialog/actor-base-class-dialog.html" },
  };

  async _prepareContext() {
    return {
      classes: await this.getClassData(),
      requireBaseClass: this.actor.characterClass.getData().requireBaseClass,
    };
  }

  async getClassData() {
    return (await this.getClasses(findClassPacks()))
      .filter((c) => !c.getData().requireBaseClass)
      .filter((c) => isCharacterGeneratorClassAllowed(c.name))
      .map((c) => ({
        name: c.name,
        baseClass: `${c.pack};${c.name}`,
        selected: `${c.pack};${c.name}` === this.actor.getData().baseClass ? "selected" : "",
      }))
      .sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  async getClasses(classPacks) {
    const classes = [];
    for (const classPack of classPacks) {
      const classItem = await classItemFromPack(classPack);
      if (classItem) classes.push(classItem);
    }
    return classes;
  }

  _onRender() {
    this.element.querySelector(".cancel-button")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.close();
    });
    this.element.querySelector(".ok-button")?.addEventListener("click", this._onOk.bind(this));
  }

  async _onOk(event) {
    event.preventDefault();
    const baseClass = this.element.querySelector("#baseClass")?.value;
    await this.actor.setBaseClass(baseClass);
    await this.close();
  }
}

/**
 * @param {PBActor} actor
 */
export const showActorBaseClassDialog = (actor) => {
  new ActorBaseClassDialog(actor).render({ force: true });
};
