import { findTargettedToken, hasTargets, isTargetSelectionValid, registerTargetAutomationHook, unregisterTargetAutomationHook } from "../api/targeting.js";
import { isEnforceTargetEnabled, targetSelectionEnabled } from "../system/settings.js";
import { getSystemFlag, setSystemFlag } from "../api/utils.js";

const ATTACK_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/attack-dialog.html";

class AttackDialog extends Application {
  constructor({ actor, callback } = {}) {
    super();
    this.actor = actor;
    this.callback = callback;

    if (targetSelectionEnabled()) {
      this.enforceTargetSelection = isEnforceTargetEnabled() && this.actor.isInCombat;
      this.targetToken = findTargettedToken();
      this.isTargetSelectionValid = isTargetSelectionValid();
      this.hasTargets = hasTargets();
      this._ontargetChangedHook = registerTargetAutomationHook(this._onTargetChanged.bind(this));
    }
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["attack-dialog"],
      template: ATTACK_DIALOG_TEMPLATE,
      title: game.i18n.localize("PB.Attack"),
      width: 460,
      height: "auto",
    });
  }

  /** @override */
  async getData(options) {
    const data = super.getData(options);
    const attackDR = (await getSystemFlag(this.actor, CONFIG.PB.flags.ATTACK_DR)) ?? 12;
    const targetArmor = await this._getTargetArmor();

    return {
      ...data,
      config: CONFIG.pirateborg,
      attackDR,
      targetArmor,
      target: this.targetToken?.actor,
      isTargetSelectionValid: this.isTargetSelectionValid,
      shouldShowTarget: this._shouldShowTarget(),
      hasTargetWarning: this._hasTargetWarning(),
    };
  }

  _hasTargetWarning() {
    return !!(this.enforceTargetSelection && !this.isTargetSelectionValid);
  }

  _shouldShowTarget() {
    if (this.enforceTargetSelection) {
      return true;
    }
    return this.hasTargets;
  }

  _onTargetChanged() {
    this.targetToken = findTargettedToken();
    this.isTargetSelectionValid = isTargetSelectionValid();
    this.hasTargets = hasTargets();
    this.render();
  }

  async _getTargetArmor() {
    if (this.targetToken) {
      return this.targetToken.actor.getActorArmorFormula();
    }
    return (await getSystemFlag(this.actor, CONFIG.PB.flags.TARGET_ARMOR)) ?? 0;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").on("click", this._onSubmit.bind(this));
    html.find(".cancel-button").on("click", this._onCancel.bind(this));

    html.find(".attack-dr .radio-input").on("change", this._onAttackDrRadioInputChanged.bind(this));
    html.find("#attackDr").on("change", this._onAttackDrInputChanged.bind(this));

    html.find(".armor-tier .radio-input").on("change", this._onArmorTierRadioInputChanged.bind(this));
    html.find("#targetArmor").on("change", this._onTargetArmorInputChanged.bind(this));
  }

  _onArmorTierRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#targetArmor").val(input.val());
    this.element.find("#targetArmor").trigger("change");
  }

  async _onTargetArmorInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await setSystemFlag(this.actor, CONFIG.PB.flags.TARGET_ARMOR, input.val());
    $(".armor-tier .radio-input").val([input.val()]);
  }

  _onAttackDrRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#attackDr").val(input.val());
    this.element.find("#attackDr").trigger("change");
  }

  async _onAttackDrInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await setSystemFlag(this.actor, CONFIG.PB.flags.ATTACK_DR, input.val());
    $(".attack-dr .radio-input").val([input.val()]);
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  _validate({ targetArmor, attackDR }) {
    return !!(targetArmor && attackDR && (this.enforceTargetSelection ? this.isTargetSelectionValid : true));
  }

  /**
   * @override
   * @param [options]
   */
  async close(options) {
    if (targetSelectionEnabled()) {
      unregisterTargetAutomationHook(this._ontargetChangedHook);
    }
    await super.close(options);
  }

  async _onSubmit(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents("form")[0];
    const targetArmor = $(form).find("#targetArmor").val();
    const attackDR = $(form).find("#attackDr").val();

    if (!this._validate({ targetArmor, attackDR })) {
      return;
    }

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
    new AttackDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
