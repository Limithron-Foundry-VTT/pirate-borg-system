import { executeCharacterCreationMacro } from "../macro-helpers.js";
import { isScvmClassAllowed, setLastScvmfactorySelection, getLastScvmfactorySelection } from "../system/settings.js";
import { classItemFromPack, createCharacter, findClassPacks, findCompendiumItem, regenerateActor } from "../generator/character-generator.js";

export default class ScvmDialog extends Application {
  constructor(actor = null, options = {}) {
    super(options);
    this.actor = actor;
    this.classPacks = findClassPacks();
    this.lastScvmfactorySelection = getLastScvmfactorySelection();
  }

  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "scvm-dialog";
    options.classes = ["pirateborg"];
    options.title = game.i18n.localize("PB.TheScvmfactory");
    options.template = "systems/pirateborg/templates/dialog/scvm-dialog.html";
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
        checked: this.lastScvmfactorySelection.length > 0 ? this.lastScvmfactorySelection.includes(clazz.pack) : true,
      }))
      .filter((clazz) => isScvmClassAllowed(clazz.name))
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
    html.find(".scvm-button").click(this._onScvm.bind(this));
  }

  _onToggleAll(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".scvm-dialog")[0];
    $(form).find(".class-checkbox").prop("checked", true);
  }

  _onToggleNone(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".scvm-dialog")[0];
    $(form).find(".class-checkbox").prop("checked", false);
  }

  _onCancel(event) {
    event.preventDefault();
    this.close();
  }

  async _onScvm(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".scvm-dialog")[0];
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

    setLastScvmfactorySelection(selection);
    const randomClass = selectedClasses[Math.floor(Math.random() * selectedClasses.length)];

    if (randomClass.data.data.characterGeneratorMacro) {
      const [compendium, macroName] = randomClass.data.data.characterGeneratorMacro.split(";");
      if (compendium) {
        const macro = await findCompendiumItem(compendium, macroName);
        await executeCharacterCreationMacro(macro, { selectedClass: randomClass, selectedClasses, actor: this.actor });
      }
      this.close();
      return;
    }

    try {
      if (this.actor) {
        await regenerateActor(this.actor, randomClass);
      } else {
        await createCharacter(randomClass);
      }
    } catch (err) {
      console.error(err);
      ui.notifications.error(`Error creating ${randomClass.name}. Check console for error log.`);
    }

    this.close();
  }
}
