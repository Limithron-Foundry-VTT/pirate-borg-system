import { actorInitiativeAction, creatureMoraleAction, creatureReactionAction } from "../../api/action/actions.js";
import PBActorSheet from "./actor-sheet.js";

export class PBActorSheetCreature extends PBActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["pirateborg", "sheet", "actor", "creature"],
    position: { width: 500, height: 600 },
    form: {
      handler: PBActorSheetCreature.#onSubmitForm,
      submitOnChange: true,
      closeOnSubmit: false,
    },
  };

  static PARTS = {
    main: {
      template: "systems/pirateborg/templates/actor/creature-sheet.html",
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

  async _onRender(context, options) {
    await super._onRender(context, options);
    if (!this.isEditable) return;

    this.element.querySelectorAll(".morale").forEach((el) => el.addEventListener("click", this._onMoraleRoll.bind(this)));
    this.element.querySelectorAll(".reaction").forEach((el) => el.addEventListener("click", this._onReactionRoll.bind(this)));
    this.element.querySelectorAll(".initiative-button").forEach((el) => el.addEventListener("click", this._onInitiativeRoll.bind(this)));
  }

  static async #onSubmitForm(event, form, formData) {
    await this.actor.update(formData.object);
  }

  async _onInitiativeRoll(event) {
    event.preventDefault();
    await actorInitiativeAction(this.actor);
  }

  async _onMoraleRoll(event) {
    event.preventDefault();
    await creatureMoraleAction(this.actor);
  }

  async _onReactionRoll(event) {
    event.preventDefault();
    await creatureReactionAction(this.actor);
  }
}
