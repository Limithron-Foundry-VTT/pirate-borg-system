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
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const CHARACTER_GENERATOR_TEMPLATE = "systems/pirateborg/templates/dialog/character-generator-dialog.html";

class CharacterGeneratorDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor = null, options = {}) {
    super(options);
    this.actor = actor;
    this.classPacks = findClassPacks();
    this.lastCharacterGeneratorSelection = getLastCharacterGeneratorSelection();
  }

  static DEFAULT_OPTIONS = {
    id: "character-generator-dialog",
    classes: ["pirateborg"],
    window: { title: "PB.CharacterGenerator" },
    position: { width: 420, height: "auto" },
  };

  static PARTS = {
    main: { template: CHARACTER_GENERATOR_TEMPLATE },
  };

  async _prepareContext() {
    return {
      classGroups: await this.getClassDataGrouped(),
      forActor: this.actor !== undefined && this.actor !== null,
    };
  }

  async getClassDataGrouped() {
    const classes = await this.getClassData();
    const groups = {};
    const savedStates = getCharacterGeneratorGroupStates();

    for (const cls of classes) {
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
        group.isOpen = group.name === "Core" ? true : !!hasCheckedClass;
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
      if (cls) classes.push(cls);
    }
    return classes;
  }

  _onRender() {
    this.element.querySelectorAll(".toggle-all").forEach((el) => el.addEventListener("click", this._onToggleAll.bind(this)));
    this.element.querySelectorAll(".toggle-none").forEach((el) => el.addEventListener("click", this._onToggleNone.bind(this)));
    this.element.querySelector(".cancel-button")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.close();
    });
    this.element.querySelector(".character-generator-button")?.addEventListener("click", this._onCharacterGenerator.bind(this));
    this.element.querySelectorAll(".module-header").forEach((el) => el.addEventListener("click", this._onToggleModule.bind(this)));
  }

  _onToggleAll(event) {
    event.preventDefault();
    this.element.querySelectorAll(".class-checkbox").forEach((el) => (el.checked = true));
  }

  _onToggleNone(event) {
    event.preventDefault();
    this.element.querySelectorAll(".class-checkbox").forEach((el) => (el.checked = false));
  }

  /**
   * @fires pirateborg.preCharacterGeneration
   * @fires pirateborg.characterGeneration
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
      ui.notifications.error(game.i18n.localize("PB.CharacterGeneratorErrorNoneSelected"));
      return;
    }

    const selectedClasses = await this.getClasses(selection);
    const isValid = selectedClasses.some((selectedClass) => !selectedClass.requireBaseClass);
    if (!isValid) {
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
        if (this.actor) this.actor.sheet.render({ force: true });
      }
      return;
    }

    try {
      if (this.actor) {
        await regenerateActor(this.actor, randomClass);
      } else {
        this.actor = await createCharacter(randomClass);
        this.actor.sheet.render({ force: true });
      }
      Hooks.call("pirateborg.characterGeneration", this.actor, callOptions);
    } catch (err) {
      console.error(err);
      ui.notifications.error(game.i18n.format("PB.CharacterGeneratorErrorGeneric", { className: randomClass.name }));
    }
  }

  async _onToggleModule(event) {
    event.preventDefault();
    const moduleGroup = event.currentTarget.closest(".module-group");
    const classesDiv = moduleGroup?.querySelector(".module-classes");
    const icon = event.currentTarget.querySelector("i");
    const groupName = event.currentTarget.dataset.group;

    if (classesDiv) {
      const isHidden = classesDiv.style.display === "none";
      classesDiv.style.display = isHidden ? "" : "none";
    }

    if (icon) {
      icon.classList.toggle("fa-chevron-down");
      icon.classList.toggle("fa-chevron-right");
    }

    const isOpen = icon?.classList.contains("fa-chevron-down") ?? false;
    const savedStates = getCharacterGeneratorGroupStates();
    savedStates[groupName] = isOpen;
    await setCharacterGeneratorGroupStates(savedStates);
  }
}

/**
 * @param {PBActor} [actor]
 */
export const showCharacterGeneratorDialog = (actor) => {
  new CharacterGeneratorDialog(actor).render({ force: true });
};
