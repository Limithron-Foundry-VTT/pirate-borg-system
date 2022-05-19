import { rollIndividualInitiative } from "../../system/combat.js";
import PBActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class PBActorSheetCreature extends PBActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["pirateborg", "sheet", "actor", "creature"],
      template: "systems/pirateborg/templates/actor/creature-sheet.html",
      width: 720,
      height: 680,
      scrollY: [".tab"],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description",
        },
      ],
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find(".morale").on("click", this._onMoraleRoll.bind(this));
    html.find(".reaction").on("click", this._onReactionRoll.bind(this));
    html.find(".initiative-button").on("click", this._onInitiativeRoll.bind(this));
  }

  async _onInitiativeRoll(event) {
    event.preventDefault();
    rollIndividualInitiative(this.actor);
  }

  /**
   * Handle morale roll.
   */
  _onMoraleRoll(event) {
    event.preventDefault();
    this.actor.checkMorale();
  }

  /**
   * Handle reaction roll.
   */
  _onReactionRoll(event) {
    event.preventDefault();
    this.actor.checkReaction();
  }
}
