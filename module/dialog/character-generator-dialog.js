import {
  isCharacterGeneratorClassAllowed,
  setLastCharacterGeneratorSelection,
  getLastCharacterGeneratorSelection,
  getCharacterGeneratorGroupStates,
  setCharacterGeneratorGroupStates,
} from "../system/settings.js";
import { createCharacter, regenerateActor } from "../api/generator/character-generator.js";
import { classItemFromPack, findClassPacks, findCompendiumItem } from "../api/compendium.js";
import { executeCharacterCreationMacro } from "../api/macros.js";

class CharacterGeneratorDialog extends Application {
  constructor(actor = null, options = {}) {
    super(options);
    this.actor = actor;
    this.classPacks = findClassPacks();
    this.lastCharacterGeneratorSelection = getLastCharacterGeneratorSelection();
  }

  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "character-generator-dialog";
    options.classes = ["pirateborg"];
    options.title = game.i18n.localize("PB.CharacterGenerator");
    options.template = "systems/pirateborg/templates/dialog/character-generator-dialog.html";
    options.width = 420;
    options.height = "auto";
    return options;
  }

  /** @override */
  async getData(options = {}) {
    return foundry.utils.mergeObject(super.getData(options), {
      classGroups: await this.getClassDataGrouped(),
      forActor: this.actor !== undefined && this.actor !== null,
    });
  }

  async getClassDataGrouped() {
    const classes = await this.getClassData();
    const groups = {};
    const savedStates = getCharacterGeneratorGroupStates();

    for (const cls of classes) {
      // Extract module name from pack name (e.g., "pirateborg.class-buccaneer" -> "pirateborg")
      const moduleName = cls.pack.split(".")[0];
      const displayName = moduleName === "pirateborg" ? "Core" : game.modules.get(moduleName)?.title || moduleName;

      if (!groups[displayName]) {
        groups[displayName] = {
          name: displayName,
          moduleId: moduleName,
          classes: [],
        };
      }

      groups[displayName].classes.push(cls);
    }

    // Convert and sort: Core first, then alphabetically
    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.name === "Core") return -1;
      if (b.name === "Core") return 1;
      return a.name.localeCompare(b.name);
    });

    for (const group of sortedGroups) {
      const hasCheckedClass = group.classes.some((cls) => cls.checked);

      if (savedStates[group.name] !== undefined) {
        group.isOpen = savedStates[group.name];
      } else {
        if (group.name === "Core") {
          group.isOpen = true; // Core always starts open
        } else {
          group.isOpen = !!hasCheckedClass; // Groups with checked classes start open
        }
      }
    }

    return sortedGroups;
  }

  async getClassData() {
    return (await this.getClasses(this.classPacks))
      .map((cls) => ({
        name: cls.name,
        pack: cls.pack,
        requireBaseClass: cls.requireBaseClass,
        checked: this.lastCharacterGeneratorSelection.length > 0 ? this.lastCharacterGeneratorSelection.includes(cls.pack) : true,
      }))
      .filter((cls) => isCharacterGeneratorClassAllowed(cls.pack))
      .sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  async getClasses(classPacks) {
    const classes = [];
    for (const classPack of classPacks) {
      const cls = await classItemFromPack(classPack);
      if (cls) {
        classes.push(cls);
      }
    }
    return classes;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html = html instanceof HTMLElement ? html : html[0];

    html.querySelectorAll(".toggle-all").forEach((el) => el.addEventListener("click", this._onToggleAll.bind(this)));
    html.querySelectorAll(".toggle-none").forEach((el) => el.addEventListener("click", this._onToggleNone.bind(this)));
    html.querySelectorAll(".cancel-button").forEach((el) => el.addEventListener("click", this._onCancel.bind(this)));
    html.querySelectorAll(".character-generator-button").forEach((el) => el.addEventListener("click", this._onCharacterGenerator.bind(this)));
    html.querySelectorAll(".module-header").forEach((el) => el.addEventListener("click", this._onToggleModule.bind(this)));
  }

  _onToggleAll(event) {
    event.preventDefault();

    const form = event.currentTarget?.closest(".character-generator-dialog");
    if (!form) return;

    form.querySelectorAll(".class-checkbox").forEach((checkbox) => {
      checkbox.checked = true;
    });
  }

  _onToggleNone(event) {
    event.preventDefault();

    const form = event.currentTarget?.closest(".character-generator-dialog");
    if (!form) return;

    form.querySelectorAll(".class-checkbox").forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  /**
   * Hook event fired at the start of character generation (via The Tavern).
   *
   * @function pirateborg.preCharacterGeneration
   * @memberof hookEvents
   * @param {PBActor|null} actor - The Actor being regenerated, or `null` when creating a new Actor.
   * @param {CharacterGenerationHookOptions} callOptions - Options for this generation request.
   */

  /**
   * Hook event fired at the start of character generation (via The Tavern).
   *
   * @function pirateborg.characterGeneration
   * @memberof hookEvents
   * @param {PBActor|null} actor - The Actor being regenerated, or `null` when creating a new Actor.
   * @param {CharacterGenerationHookOptions} callOptions - Options for this generation request.
   */

  /**
   * @typedef {object} CharacterGenerationHookOptions
   * @property {HTMLElement} html - The dialog form element.
   * @property {object} formData - The expanded form data from the dialog.
   * @property {"create"|"regenerate"} method - Indicates whether the dialog is creating a new Actor or regenerating an existing one.
   * @property {string[]} selectedClasses - The list of selected class pack names. This is what is used by the generator.
   */

  /**
   * Handle character generation via The Tavern.
   *
   * @fires hookEvents#pirateborg.preCharacterGeneration
   * @fires hookEvents#pirateborg.characterGeneration
   * @param {MouseEvent} event
   */
  async _onCharacterGenerator(event) {
    event.preventDefault();

    const method = this.actor ? "regenerate" : "create";
    const form = event.currentTarget?.closest("form");
    if (!form) return;

    const formData = new foundry.applications.ux.FormDataExtended(form).object;
    const selection = Array.from(form.querySelectorAll(".class-groups input:checked")).map((checkbox) => checkbox.name);

    const callOptions = { html: form, formData, method, selectedClasses: selection };
    Hooks.call("pirateborg.preCharacterGeneration", this.actor, callOptions);

    if (selection.length === 0) {
      // nothing selected, so bail
      ui.notifications.error(game.i18n.localize("PB.CharacterGeneratorErrorNoneSelected"));
      return;
    }

    const selectedClasses = await this.getClasses(selection);
    const isValid = selectedClasses.some((selectedClass) => !selectedClass.requireBaseClass);
    if (!isValid) {
      // require at least one normal class
      ui.notifications.error(game.i18n.localize("PB.CharacterGeneratorErrorNoBaseClassSelected"));
      return;
    }

    await setLastCharacterGeneratorSelection(selection);
    const randomClass = selectedClasses[Math.floor(Math.random() * selectedClasses.length)];

    await this.close();
    ui.notifications.info(
      game.i18n.format("PB.CharacterGeneratorCreating", {
        user: game.users.current.name,
        className: randomClass.name,
      })
    );

    if (randomClass.characterGeneratorMacro) {
      const [compendium, macroName] = randomClass.characterGeneratorMacro.split(";");
      if (compendium) {
        const macro = await findCompendiumItem(compendium, macroName);
        await executeCharacterCreationMacro(macro, {
          selectedClass: randomClass,
          selectedClasses,
          actor: this.actor,
        });
        if (this.actor) {
          this.actor.sheet.render(true);
        }
      }
      return;
    }

    try {
      if (this.actor) {
        await regenerateActor(this.actor, randomClass);
      } else {
        this.actor = await createCharacter(randomClass);
        this.actor.sheet.render(true);
      }

      Hooks.call("pirateborg.characterGeneration", this.actor, callOptions);
    } catch (err) {
      console.error(err);
      ui.notifications.error(
        game.i18n.format("PB.CharacterGeneratorErrorGeneric", {
          className: randomClass.name,
        })
      );
    }
  }

  async _onToggleModule(event) {
    event.preventDefault();
    const header = $(event.currentTarget);
    const moduleGroup = header.closest(".module-group");
    const classesDiv = moduleGroup.find(".module-classes");
    const icon = header.find("i");
    const groupName = header.find("span").text();

    classesDiv.slideToggle(200);
    icon.toggleClass("fa-chevron-down fa-chevron-right");

    const isOpen = icon.hasClass("fa-chevron-down");
    const savedStates = getCharacterGeneratorGroupStates();
    savedStates[groupName] = isOpen;
    await setCharacterGeneratorGroupStates(savedStates);
  }
}

/**
 * @param {PBActor} [actor]
 */
export const showCharacterGeneratorDialog = (actor) => {
  const characterGeneratorDialog = new CharacterGeneratorDialog(actor);
  characterGeneratorDialog.render(true);
};
