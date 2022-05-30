import {
  findTargettedToken,
  hasTargets,
  isTargetSelectionValid,
  registerTargetAutomationHook,
  unregisterTargetAutomationHook,
} from "../system/automation/target-automation.js";
import { isEnforceTargetEnabled, targetSelectionEnabled } from "../system/settings.js";

const ATTACK_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/attack-dialog.html";

class AttackDialog extends Application {
  constructor({ actor, callback } = {}) {
    super();
    this.actor = actor;
    this.callback = callback;
    this.enforceTargetSelection = isEnforceTargetEnabled();

    if (targetSelectionEnabled()) {
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
  async getData() {
    const attackDR = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.ATTACK_DR)) ?? 12;
    const targetArmor = await this._getTargetArmor();

    return {
      config: CONFIG.pirateborg,
      attackDR,
      targetArmor,
      target: this.targetToken ? this.targetToken?.actor.name : "",
      isTargetSelectionValid: this.isTargetSelectionValid,
      shouldShowTarget: this._shouldShowTarget(),
      hasTargetWarning: this._hasTargetWarning(),
    };
  }

  _hasTargetWarning() {
    if (this.enforceTargetSelection && !this.isTargetSelectionValid) {
      return true;
    }
    return false;
  }

  _shouldShowTarget() {
    if (this.enforceTargetSelection) {
      return true;
    }
    if (this.hasTargets) {
      return true;
    }
    return false;
  }

  _onTargetChanged() {
    this.targetToken = findTargettedToken();
    this.isTargetSelectionValid = isTargetSelectionValid();
    this.hasTargets = hasTargets();
    this.render();
  }

  async _getTargetArmor() {
    if (this.targetToken) {
      return this.targetToken.actor.getArmorFormula();
    }
    return (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.TARGET_ARMOR)) ?? 0;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").click(this._onSubmit.bind(this));
    html.find(".cancel-button").click(this._onCancel.bind(this));

    html.find(".attack-dr .radio-input").on("change", this._onAttackDrRadioInputChanged.bind(this));
    html.find("#attackDr").on("change", this._onAttackDrInputChanged.bind(this));

    html.find(".armor-tier .radio-input").on("change", this._onArmorTierRadioInputChanged.bind(this));
    html.find("#targetArmor").on("change", this._onTargetArmorInputChanged.bind(this));
  }

  _onArmorTierRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#targetArmor").val(input.val());
    this.element.find("#targetArmor").change();
  }

  async _onTargetArmorInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.TARGET_ARMOR, input.val());
    $(".armor-tier .radio-input").val([input.val()]);
  }

  _onAttackDrRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#attackDr").val(input.val());
    this.element.find("#attackDr").change();
  }

  async _onAttackDrInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.ATTACK_DR, input.val());
    $(".attack-dr .radio-input").val([input.val()]);
  }

  _onCancel(event) {
    event.preventDefault();
    this.close();
  }

  _validate({ targetArmor, attackDR }) {
    if (targetArmor && attackDR && (this.enforceTargetSelection ? this.isTargetSelectionValid : true)) {
      return true;
    }

    return false;
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
    this.close();
  }
}

/**
 * @param {Object} data
 * @param {Actor} data.actor
 * @returns {Promise.<{targetArmor: String, attackDR: Number, targetToken: Token}>}
 */
export const showAttackDialog = (data = {}) => {
  return new Promise((resolve) => {
    new AttackDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
};
