import { actorInitiativeAction, creatureMoraleAction, creatureReactionAction } from "../../api/action/actions.js";
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
      width: 500,
      height: 600,
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

    if (!this.options.editable) return;

    this.bindSelectorsEvent("click", {
      ".morale": this._onMoraleRoll,
      ".reaction": this._onReactionRoll,
      ".initiative-button": this._onInitiativeRoll,
    });
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onInitiativeRoll(event) {
    event.preventDefault();
    actorInitiativeAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onMoraleRoll(event) {
    event.preventDefault();
    await creatureMoraleAction(this.actor);
  }

  /**
   * @param {MouseEvent} event
   * @private
   */
  async _onReactionRoll(event) {
    event.preventDefault();
    await creatureReactionAction(this.actor);
  }
}
