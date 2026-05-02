import { findTargettedToken, hasTargets, isTargetSelectionValid, registerTargetAutomationHook, unregisterTargetAutomationHook } from "../api/targeting.js";
import { isEnforceTargetEnabled } from "../system/settings.js";
import { getSystemFlag, setSystemFlag } from "../api/utils.js";
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const ATTACK_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/attack-dialog.html";

class AttackDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({ actor, weapon, callback } = {}) {
    super();
    this.actor = actor;
    this.weapon = weapon;
    this.callback = callback;

    this.enforceTargetSelection = isEnforceTargetEnabled() && this.actor.isInCombat;
    this.isTargetSelectionValid = isTargetSelectionValid();
    this.hasTargets = hasTargets();
    this.targetToken = findTargettedToken();
    this.shouldIgnoreArmor = this._shouldIgnoreArmor();
    this._ontargetChangedHook = registerTargetAutomationHook(this._onTargetChanged.bind(this));
  }

  static DEFAULT_OPTIONS = {
    classes: ["attack-dialog", "standard-form"],
    window: { title: "PB.Attack" },
    position: { width: 460, height: "auto" },
  };

  static PARTS = {
    main: { template: ATTACK_DIALOG_TEMPLATE },
  };

  async _prepareContext() {
    const attackDR = (await getSystemFlag(this.actor, CONFIG.PB.flags.ATTACK_DR)) ?? 12;
    const targetArmor = this.shouldIgnoreArmor ? "0" : await this._getTargetArmor();

    return {
      config: CONFIG.pirateborg,
      attackDR,
      targetArmor,
      target: this.targetToken?.actor,
      shouldIgnoreArmor: this.shouldIgnoreArmor,
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

    this.element.querySelectorAll(".attack-dr .radio-input").forEach((el) => el.addEventListener("change", this._onAttackDrRadioInputChanged.bind(this)));
    this.element.querySelector("#attackDr")?.addEventListener("change", this._onAttackDrInputChanged.bind(this));

    this.element.querySelectorAll(".armor-tier .radio-input").forEach((el) => el.addEventListener("change", this._onArmorTierRadioInputChanged.bind(this)));
    this.element.querySelector("#targetArmor")?.addEventListener("change", this._onTargetArmorInputChanged.bind(this));
  }

  _hasTargetWarning() {
    return !!(this.enforceTargetSelection && !this.isTargetSelectionValid);
  }

  _shouldShowTarget() {
    return this.enforceTargetSelection || this.hasTargets;
  }

  _shouldIgnoreArmor() {
    if (this.targetToken?.actor.isAnyVehicle) return false;
    if (this.weapon.isGunpowderWeapon) return true;
  }

  _onTargetChanged() {
    this.targetToken = findTargettedToken();
    this.isTargetSelectionValid = isTargetSelectionValid();
    this.hasTargets = hasTargets();
    this.shouldIgnoreArmor = this._shouldIgnoreArmor();
    this.render();
  }

  async _getTargetArmor() {
    if (this.targetToken) return this.targetToken.actor.getActorArmorFormula();
    return (await getSystemFlag(this.actor, CONFIG.PB.flags.TARGET_ARMOR)) ?? 0;
  }

  _onArmorTierRadioInputChanged(event) {
    event.preventDefault();
    const targetArmorEl = this.element.querySelector("#targetArmor");
    if (targetArmorEl) {
      targetArmorEl.value = event.currentTarget.value;
      targetArmorEl.dispatchEvent(new Event("change"));
    }
  }

  async _onTargetArmorInputChanged(event) {
    event.preventDefault();
    const value = event.currentTarget.value;
    await setSystemFlag(this.actor, CONFIG.PB.flags.TARGET_ARMOR, value);
    this.element.querySelectorAll(".armor-tier .radio-input").forEach((el) => {
      el.checked = el.value === value;
    });
  }

  _onAttackDrRadioInputChanged(event) {
    event.preventDefault();
    const attackDrEl = this.element.querySelector("#attackDr");
    if (attackDrEl) {
      attackDrEl.value = event.currentTarget.value;
      attackDrEl.dispatchEvent(new Event("change"));
    }
  }

  async _onAttackDrInputChanged(event) {
    event.preventDefault();
    const value = event.currentTarget.value;
    await setSystemFlag(this.actor, CONFIG.PB.flags.ATTACK_DR, value);
    this.element.querySelectorAll(".attack-dr .radio-input").forEach((el) => {
      el.checked = el.value === value;
    });
  }

  _validate({ targetArmor, attackDR }) {
    return !!(targetArmor && attackDR && (this.enforceTargetSelection ? this.isTargetSelectionValid : true));
  }

  async close(options) {
    unregisterTargetAutomationHook(this._ontargetChangedHook);
    await super.close(options);
  }

  async _onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget.closest("form");
    const targetArmor = form.querySelector("#targetArmor")?.value;
    const attackDR = form.querySelector("#attackDr")?.value;

    if (!this._validate({ targetArmor, attackDR })) return;

    this.callback({
      targetArmor,
      attackDR: parseInt(attackDR, 10),
      targetToken: this.targetToken,
    });
    await this.close();
  }
}

/**
 * @param {Object} data
 * @param {Actor} data.actor
 * @returns {Promise.<{targetArmor: String, attackDR: Number, targetToken: Token}>}
 */
export const showAttackDialog = (data = {}) =>
  new Promise((resolve) => {
    new AttackDialog({ ...data, callback: resolve }).render({ force: true });
  });
