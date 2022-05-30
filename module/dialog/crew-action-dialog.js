import { findTargettedToken, hasTargets, isTargetSelectionValid, registerTargetAutomationHook, unregisterTargetAutomationHook } from "../system/automation/target-automation.js";
import { targetSelectionEnabled } from "../system/settings.js";

const SHIP_CREW_ACTION_TEMPLATE = "systems/pirateborg/templates/dialog/ship-crew-action-dialog.html";

class CrewActionDialog extends Application {
  constructor({
    actor,
    title,
    description,
    canSubmit = true,
    enableCrewSelection = false,
    enableDrSelection = false,
    enableArmorSelection = false,
    enableMovementSelection = false,
    enableTargetSelection = false,
    callback,
  } = {}) {
    super();
    this.actor = actor;
    this.crewActionTitle = title;
    this.crewActionDescription = description;
    this.canSubmit = canSubmit;
    this.enableCrewSelection = enableCrewSelection;
    this.enableDrSelection = enableDrSelection;
    this.enableArmorSelection = enableArmorSelection;
    this.enableTargetSelection = enableTargetSelection;
    this.enableMovementSelection = enableMovementSelection;
    this.callback = callback;

    if (targetSelectionEnabled() && this.enableTargetSelection) {
      this.targetToken = findTargettedToken();   
      this.isTargetSelectionValid = isTargetSelectionValid();
      this.hasTargets = hasTargets();
      this._ontargetChangedHook = registerTargetAutomationHook(this._onTargetChanged.bind(this));
    }
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["crew-action-dialog"],
      template: SHIP_CREW_ACTION_TEMPLATE,
      title: game.i18n.localize("PB.ShipCrewAction"),
      width: 420,
      height: "auto",
    });
  }

  /** @override */
  async getData() {
    const selectedCrewId = await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.SELECTED_CREW);
    const selectedDR = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.ATTACK_DR)) ?? "12";
    const selectedArmor = await this._getTargetArmor();

    return {
      config: CONFIG.pirateborg,
      crews: this.actor.crews.map((actorId) => game.actors.get(actorId).data),
      enableCrewSelection: this.enableCrewSelection,
      enableDrSelection: this.enableDrSelection,
      enableArmorSelection: this.enableArmorSelection,
      enableMovementSelection: this.enableMovementSelection,
      crewActionDescription: this.crewActionDescription,
      crewActionTitle: this.crewActionTitle,
      canSubmit: this.canSubmit,
      selectedDR,
      selectedCrewId,
      selectedArmor,
      target: this.targetToken ? this.targetToken?.actor.name : "",
      isTargetSelectionValid: this.isTargetSelectionValid,
      shouldShowTarget: this._shouldShowTarget(),
      hasTargetWarning: this._hasTargetWarning(),
    };
  }

  _shouldShowTarget() {
    if (this.enforceTargetSelection) { return true; }
    if (this.hasTargets) { return true; }
    return false;
  }

  _onTargetChanged(targets) {
    this.targetToken = findTargettedToken();   
    this.isTargetSelectionValid = isTargetSelectionValid();
    this.hasTargets = hasTargets();
    this.render();
  }

  async _getTargetArmor() {
    if (this.targetToken) {
      return this.targetToken.actor.getArmorFormula();
    }
    return (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.TARGET_ARMOR)) ?? "0";
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").click(this._onSubmit.bind(this));
    html.find(".cancel-button").click(this._onCancel.bind(this));
    html.find(".dr .radio-input").on("change", this._onDrInputChanged.bind(this));
    html.find(".armor-tier .radio-input").on("change", this._onArmorInputChanged.bind(this));
    html.find(".movement .radio-input").on("change", this._onMovementInputChanged.bind(this));
  }

  _onDrInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#dr").val(input.val());
  }

  async _onArmorInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.TARGET_ARMOR, input.val());
    this.element.find("#targetArmor").val(input.val());
  }

  _onMovementInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#movement").val(input.val());
  }

  _onCancel(event) {
    event.preventDefault();
    this.close();
  }

  _validate({ selectedDR, selectedArmor, selectedMovement }) {
    if ((this.enableDrSelection && !selectedDR) || (this.enableArmorSelection && !selectedArmor) || (this.enableMovementSelection && !selectedMovement)) {
      return false;
    }

    if (this.enforceTargetSelection && !this.isTargetSelectionValid) {
      return false;    
    }

    return true;
  }

  close() {
    if (targetSelectionEnabled()) {
      unregisterTargetAutomationHook(this._ontargetChangedHook);
    }
    super.close();
  }

  async _onSubmit(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents("form")[0];
    const selectedCrewId = $(form).find("#crewActor").val();
    const selectedDR = $(form).find("#dr").val();
    const selectedArmor = $(form).find("#targetArmor").val();
    const selectedMovement = $(form).find("#movement").val();

    if (!this._validate({ selectedDR, selectedArmor, selectedMovement })) {
      return;
    }

    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.SELECTED_CREW, selectedCrewId);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.ATTACK_DR, selectedDR);

    this.callback({
      selectedActor: game.actors.get(selectedCrewId),
      selectedDR: parseInt(selectedDR, 10),
      selectedArmor: selectedArmor,
      selectedMovement: selectedMovement,
    });
    this.close();
  }
}

/**
 * @param {Object} data
 * @param {Actor} data.actor
 * @param {String} data.description
 * @param {String} data.title
 * @param {Boolean} data.enableCrewSelection
 * @param {Boolean} data.enableDrSelection
 * @param {Boolean} data.enableArmorSelection
 * @param {Boolean} data.enableMovementSelection
 * @param {Boolean} data.canSubmit
 * @returns {Promise.<{selectedActor: Actor, selectedDR: Number, selectedArmor: String, selectedMovement: Number}>}
 */
export const showCrewActionDialog = (data = {}) => {
  return new Promise((resolve) => {
    new CrewActionDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
};
