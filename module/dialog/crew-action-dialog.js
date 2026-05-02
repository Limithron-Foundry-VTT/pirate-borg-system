import { findTargettedToken, hasTargets, isTargetSelectionValid, registerTargetAutomationHook, unregisterTargetAutomationHook } from "../api/targeting.js";
import { isEnforceTargetEnabled } from "../system/settings.js";
import { getSystemFlag, setSystemFlag } from "../api/utils.js";
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const SHIP_CREW_ACTION_TEMPLATE = "systems/pirateborg/templates/dialog/ship-crew-action-dialog.html";

class CrewActionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
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

  static DEFAULT_OPTIONS = {
    classes: ["crew-action-dialog", "standard-form"],
    window: { title: "PB.ShipCrewAction" },
    position: { width: 420, height: "auto" },
  };

  static PARTS = {
    main: { template: SHIP_CREW_ACTION_TEMPLATE },
  };

  async _prepareContext() {
    const selectedCrewId = await getSystemFlag(this.actor, CONFIG.PB.flags.SELECTED_CREW);
    const selectedDR = (await getSystemFlag(this.actor, CONFIG.PB.flags.ATTACK_DR)) ?? "12";
    const selectedArmor = this.shouldIgnoreArmor ? "0" : await this._getTargetArmor();

    return {
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

  _onRender() {
    this.element.querySelector(".ok-button")?.addEventListener("click", this._onSubmit.bind(this));
    this.element.querySelector(".cancel-button")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.close();
    });

    this.element.querySelectorAll(".dr .radio-input").forEach((el) => el.addEventListener("change", this._onDrRadioInputChanged.bind(this)));
    this.element.querySelector("#dr")?.addEventListener("change", this._onDrInputChanged.bind(this));

    this.element.querySelectorAll(".armor-tier .radio-input").forEach((el) => el.addEventListener("change", this._onArmorRadioInputChanged.bind(this)));
    this.element.querySelector("#targetArmor")?.addEventListener("change", this._onArmorInputChanged.bind(this));

    this.element.querySelectorAll(".movement .radio-input").forEach((el) => el.addEventListener("change", this._onMovementRadioInputChanged.bind(this)));
    this.element.querySelector("#movement")?.addEventListener("change", this._onMovementInputChanged.bind(this));
  }

  _hasTargetWarning() {
    return this.enforceTargetSelection && !this.isTargetSelectionValid;
  }

  _shouldShowTarget() {
    if (!this.enableTargetSelection) return false;
    return this.enforceTargetSelection || this.hasTargets;
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
    if (this.targetToken) return this.targetToken.actor.getActorArmorFormula();
    return (await getSystemFlag(this.actor, CONFIG.PB.flags.TARGET_ARMOR)) ?? "0";
  }

  _onDrRadioInputChanged(event) {
    event.preventDefault();
    const drEl = this.element.querySelector("#dr");
    if (drEl) {
      drEl.value = event.currentTarget.value;
      drEl.dispatchEvent(new Event("change"));
    }
  }

  async _onDrInputChanged(event) {
    event.preventDefault();
    const value = event.currentTarget.value;
    await setSystemFlag(this.actor, CONFIG.PB.flags.ATTACK_DR, value);
    this.element.querySelectorAll(".dr .radio-input").forEach((el) => {
      el.checked = el.value === value;
    });
  }

  _onArmorRadioInputChanged(event) {
    event.preventDefault();
    const targetArmorEl = this.element.querySelector("#targetArmor");
    if (targetArmorEl) {
      targetArmorEl.value = event.currentTarget.value;
      targetArmorEl.dispatchEvent(new Event("change"));
    }
  }

  async _onArmorInputChanged(event) {
    event.preventDefault();
    const value = event.currentTarget.value;
    await setSystemFlag(this.actor, CONFIG.PB.flags.TARGET_ARMOR, value);
    this.element.querySelectorAll(".armor-tier .radio-input").forEach((el) => {
      el.checked = el.value === value;
    });
  }

  _onMovementRadioInputChanged(event) {
    event.preventDefault();
    const movementEl = this.element.querySelector("#movement");
    if (movementEl) {
      movementEl.value = event.currentTarget.value;
      movementEl.dispatchEvent(new Event("change"));
    }
  }

  async _onMovementInputChanged(event) {
    event.preventDefault();
    this.element.querySelectorAll(".movement .radio-input").forEach((el) => {
      el.checked = el.value === event.currentTarget.value;
    });
  }

  _validate({ selectedDR, selectedArmor, selectedMovement }) {
    if ((this.enableDrSelection && !selectedDR) || (this.enableArmorSelection && !selectedArmor) || (this.enableMovementSelection && !selectedMovement)) {
      return false;
    }
    return !(this.enableTargetSelection && this.enforceTargetSelection && !this.isTargetSelectionValid);
  }

  async close(options) {
    if (this.enableTargetSelection) {
      unregisterTargetAutomationHook(this._ontargetChangedHook);
    }
    await super.close(options);
  }

  async _onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget.closest("form");
    const selectedCrewId = form.querySelector("#crewActor")?.value;
    const selectedDR = form.querySelector("#dr")?.value;
    const selectedArmor = form.querySelector("#targetArmor")?.value;
    const selectedMovement = form.querySelector("#movement")?.value;

    if (!this._validate({ selectedDR, selectedArmor, selectedMovement })) return;

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
    new CrewActionDialog({ ...data, callback: resolve }).render({ force: true });
  });
