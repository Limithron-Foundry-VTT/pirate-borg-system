import { findTargettedToken, hasTargets, isTargetSelectionValid, registerTargetAutomationHook, unregisterTargetAutomationHook } from "../api/targeting.js";
import { isEnforceTargetEnabled } from "../system/settings.js";
import { getSystemFlag, setSystemFlag } from "../api/utils.js";

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
    buttonLabel = "PB.Roll",
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
    this.enableMovementSelection = enableMovementSelection;
    this.enableTargetSelection = enableTargetSelection;

    if (this.enableTargetSelection) {
      this.isTargetSelectionValid = isTargetSelectionValid();
      this.hasTargets = hasTargets();
      this.targetToken = findTargettedToken();
      this._ontargetChangedHook = registerTargetAutomationHook(this._onTargetChanged.bind(this));
    }

    this.enforceTargetSelection = isEnforceTargetEnabled();
    this.shouldIgnoreArmor = this._shouldIgnoreArmor();
    this.buttonLabel = buttonLabel;
    this.callback = callback;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["crew-action-dialog"],
      template: SHIP_CREW_ACTION_TEMPLATE,
      title: game.i18n.localize("PB.ShipCrewAction"),
      width: 420,
      height: "auto",
    });
  }

  /** @override */
  async getData(options) {
    const data = super.getData(options);
    const selectedCrewId = await getSystemFlag(this.actor, CONFIG.PB.flags.SELECTED_CREW);
    const selectedDR = (await getSystemFlag(this.actor, CONFIG.PB.flags.ATTACK_DR)) ?? "12";
    const selectedArmor = this.shouldIgnoreArmor ? "0" : await this._getTargetArmor();

    return {
      ...data,
      config: CONFIG.pirateborg,
      buttonLabel: this.buttonLabel,
      crews: this.actor.crews.map((actorId) => game.actors.get(actorId).toObject()),
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
      shouldIgnoreArmor: this.shouldIgnoreArmor,
      target: this.targetToken?.actor,
      isTargetSelectionValid: this.isTargetSelectionValid,
      shouldShowTarget: this._shouldShowTarget(),
      hasTargetWarning: this._hasTargetWarning(),
    };
  }

  _hasTargetWarning() {
    return this.enforceTargetSelection && !this.isTargetSelectionValid;
  }

  _shouldShowTarget() {
    if (!this.enableTargetSelection) {
      return false;
    }
    if (this.enforceTargetSelection) {
      return true;
    }
    return this.hasTargets;
  }

  _onTargetChanged() {
    this.targetToken = findTargettedToken();
    this.isTargetSelectionValid = isTargetSelectionValid();
    this.hasTargets = hasTargets();
    this.shouldIgnoreArmor = this._shouldIgnoreArmor();
    this.render();
  }

  _shouldIgnoreArmor() {
    return !this.targetToken?.actor.isAnyVehicle;
  }

  async _getTargetArmor() {
    if (this.targetToken) {
      return this.targetToken.actor.getActorArmorFormula();
    }
    return (await getSystemFlag(this.actor, CONFIG.PB.flags.TARGET_ARMOR)) ?? "0";
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").on("click", this._onSubmit.bind(this));
    html.find(".cancel-button").on("click", this._onCancel.bind(this));

    html.find(".dr .radio-input").on("change", this._onDrRadioInputChanged.bind(this));
    html.find("#dr").on("change", this._onDrInputChanged.bind(this));

    html.find(".armor-tier .radio-input").on("change", this._onArmorRadioInputChanged.bind(this));
    html.find("#targetArmor").on("change", this._onArmorInputChanged.bind(this));

    html.find(".movement .radio-input").on("change", this._onMovementRadioInputChanged.bind(this));
    html.find("#movement").on("change", this._onMovementInputChanged.bind(this));
  }

  _onDrRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#dr").val(input.val());
    this.element.find("#dr").trigger("change");
  }

  async _onDrInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await setSystemFlag(this.actor, CONFIG.PB.flags.ATTACK_DR, input.val());
    $(".dr .radio-input").val([input.val()]);
  }

  async _onArmorRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#targetArmor").val(input.val());
    this.element.find("#targetArmor").trigger("change");
  }

  async _onArmorInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await setSystemFlag(this.actor, CONFIG.PB.flags.TARGET_ARMOR, input.val());
    $(".armor-tier .radio-input").val([input.val()]);
  }

  _onMovementRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#movement").val(input.val());
    this.element.find("#movement").trigger("change");
  }

  async _onMovementInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    $(".movement .radio-input").val([input.val()]);
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  _validate({ selectedDR, selectedArmor, selectedMovement }) {
    if ((this.enableDrSelection && !selectedDR) || (this.enableArmorSelection && !selectedArmor) || (this.enableMovementSelection && !selectedMovement)) {
      return false;
    }

    return !(this.enableTargetSelection && this.enforceTargetSelection && !this.isTargetSelectionValid);
  }

  /**
   * @override
   * @param [options]
   */
  async close(options) {
    if (this.enableTargetSelection) {
      unregisterTargetAutomationHook(this._ontargetChangedHook);
    }
    await super.close(options);
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

    this.callback({
      selectedActor: game.actors.get(selectedCrewId),
      selectedDR: parseInt(selectedDR, 10),
      selectedArmor,
      selectedMovement,
      targetToken: this.targetToken,
    });
    await this.close();
  }
}

/**
 * @param {Object} data
 * @param {Actor} data.actor
 * @param {String} [data.description]
 * @param {String} [data.title]
 * @param {Boolean} [data.enableCrewSelection]
 * @param {Boolean} [data.enableDrSelection]
 * @param {Boolean} [data.enableArmorSelection]
 * @param {Boolean} [data.enableMovementSelection]
 * @param {Boolean} [data.enableTargetSelection]
 * @param {Boolean} [data.canSubmit]
 * @param {String} [data.buttonLabel]
 * @returns {Promise.<{selectedActor: Actor, selectedDR: Number, selectedArmor: String, selectedMovement: Number, targetToken: Token}>}
 */
export const showCrewActionDialog = (data = {}) =>
  new Promise((resolve) => {
    new CrewActionDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
