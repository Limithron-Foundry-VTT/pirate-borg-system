import { executeCharacterCreationMacro } from "../macro-helpers.js";
import { isCharacterGeneratorClassAllowed, setLastCharacterGeneratorSelection, getLastCharacterGeneratorSelection } from "../system/settings.js";
import { createCharacter, regenerateActor } from "../generator/character-generator.js";
import { classItemFromPack, findClassPacks, findCompendiumItem } from "../compendium.js";

export default class CharacterGeneratorDialog extends Application {
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
      .map((clazz) => ({
        name: clazz.name,
        pack: clazz.pack,
        requireBaseClass: clazz.data.data.requireBaseClass,
        checked: this.lastCharacterGeneratorSelection.length > 0 ? this.lastCharacterGeneratorSelection.includes(clazz.pack) : true,
      }))
      .filter((clazz) => isCharacterGeneratorClassAllowed(clazz.pack))
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
    html.find(".toggle-all").click(this._onToggleAll.bind(this));
    html.find(".toggle-none").click(this._onToggleNone.bind(this));
    html.find(".cancel-button").click(this._onCancel.bind(this));
    html.find(".character-generator-button").click(this._onCharacterGenerator.bind(this));
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

  _onCancel(event) {
    event.preventDefault();
    this.close();
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

    setLastCharacterGeneratorSelection(selection);
    const randomClass = selectedClasses[Math.floor(Math.random() * selectedClasses.length)];

    this.close();
    ui.notifications.info(`${game.users.current.name} is creating ${randomClass.name}.`);

    if (randomClass.data.data.characterGeneratorMacro) {
      const [compendium, macroName] = randomClass.data.data.characterGeneratorMacro.split(";");
      if (compendium) {
        const macro = await findCompendiumItem(compendium, macroName);
        await executeCharacterCreationMacro(macro, { selectedClass: randomClass, selectedClasses, actor: this.actor });
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
