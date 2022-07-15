import { isCharacterGeneratorClassAllowed, setLastCharacterGeneratorSelection, getLastCharacterGeneratorSelection } from "../system/settings.js";
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
    return mergeObject(super.getData(options), {
      classes: await this.getClassData(),
      forActor: this.actor !== undefined && this.actor !== null,
    });
  }

  async getClassData() {
    return (await this.getClasses(this.classPacks))
      .map((cls) => ({
        name: cls.name,
        pack: cls.pack,
        requireBaseClass: cls.data.data.requireBaseClass,
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
    html.find(".toggle-all").on("click", this._onToggleAll.bind(this));
    html.find(".toggle-none").on("click", this._onToggleNone.bind(this));
    html.find(".cancel-button").on("click", this._onCancel.bind(this));
    html.find(".character-generator-button").on("click", this._onCharacterGenerator.bind(this));
  }

  _onToggleAll(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".character-generator-dialog")[0];
    $(form).find(".class-checkbox").prop("checked", true);
  }

  _onToggleNone(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".character-generator-dialog")[0];
    $(form).find(".class-checkbox").prop("checked", false);
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  async _onCharacterGenerator(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".character-generator-dialog")[0];
    const selection = [];

    $(form)
      .find("input:checked")
      .each(function () {
        selection.push($(this).attr("name"));
      });

    if (selection.length === 0) {
      // nothing selected, so bail
      return;
    }

    const selectedClasses = await this.getClasses(selection);
    const isValid = selectedClasses.some((selectedClass) => !selectedClass.data.data.requireBaseClass);
    if (!isValid) {
      // require at least one normal class
      return;
    }

    await setLastCharacterGeneratorSelection(selection);
    const randomClass = selectedClasses[Math.floor(Math.random() * selectedClasses.length)];

    await this.close();
    ui.notifications.info(`${game.users.current.name} is creating ${randomClass.name}.`);

    if (randomClass.data.data.characterGeneratorMacro) {
      const [compendium, macroName] = randomClass.data.data.characterGeneratorMacro.split(";");
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
        const actor = await createCharacter(randomClass);
        actor.sheet.render(true);
      }
    } catch (err) {
      console.error(err);
      ui.notifications.error(`Error creating ${randomClass.name}. Check console for error log.`);
    }
  }
}

/**
 * @param {PBActor} [actor]
 */
export const showCharacterGeneratorDialog = (actor) => {
  const characterGeneratorDialog = new CharacterGeneratorDialog(actor);
  characterGeneratorDialog.render(true);
};
