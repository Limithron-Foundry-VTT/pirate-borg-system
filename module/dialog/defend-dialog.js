import { findTargettedToken, hasTargets, isTargetSelectionValid, registerTargetAutomationHook, unregisterTargetAutomationHook } from "../system/automation/target-automation.js";
import { isEnforceTargetEnabled, targetSelectionEnabled } from "../system/settings.js";

const DEFEND_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/defend-dialog.html";

class DefendDialog extends Application {
  constructor({ actor, callback } = {}) {
    super();
    this.actor = actor;
    this.armir = actor;
    this.callback = callback;
    this.modifiers = this._getModifiers();

    if (targetSelectionEnabled()) {
      this.enforceTargetSelection = isEnforceTargetEnabled();
      this.targetToken = findTargettedToken();   
      this.isTargetSelectionValid = isTargetSelectionValid();
      this.hasTargets = hasTargets();

      this._ontargetChangedHook = registerTargetAutomationHook(this._onTargetChanged.bind(this));
    }
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["defend-dialog"],
      template: DEFEND_DIALOG_TEMPLATE,
      title: game.i18n.localize("PB.Defend"),
      width: 460,
      height: "auto",
    });
  }

  /** @override */
  async getData() {
    const defendDR = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_DR)) ?? 12;
    const defendArmor = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_ARMOR)) ?? this._getArmorDamageReductionDie();
    const incomingAttack = await this._getIncomingAttack();

    return {
      config: CONFIG.pirateborg,
      incomingAttack,
      defendDR,
      defendArmor,
      drModifiers: this.modifiers.warning,
      target: this.targetToken ? this.targetToken?.actor.name : "",
      isTargetSelectionValid: this.isTargetSelectionValid,
      shouldShowTarget: this._shouldShowTarget(),
      hasTargetWarning: this._hasTargetWarning()      
    };
  }

  async _getIncomingAttack() {
    if (this.targetToken) {
      return this.targetToken.actor.getAttackFormula();
    }
    return (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.INCOMING_ATTACK)) ?? "1d4";
  }

  _hasTargetWarning() {
    if (this.enforceTargetSelection && !this.isTargetSelectionValid) { return true; }
    return false;
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

  _getArmorDamageReductionDie() {
    return CONFIG.PB.armorTiers[this.actor.equippedArmor()?.data.data.tier.value ?? 0].damageReductionDie;
  }

  _getModifiers() {
    const modifiers = {
      total: 0,
      warning: [],
    };
    const armor = this.actor.equippedArmor();
    if (armor) {
      const defenseModifier = CONFIG.PB.armorTiers[armor.data.data.tier.max].defenseModifier;
      if (defenseModifier) {
        modifiers.total += defenseModifier;
        modifiers.warning.push(`${armor.name}: ${game.i18n.localize("PB.DR")} + ${defenseModifier}`);
      }
    }
    if (this.actor.isEncumbered()) {
      modifiers.total += 2;
      modifiers.warning.push(`${game.i18n.localize("PB.Encumbered")}: ${game.i18n.localize("PB.DR")} + 2`);
    }
    return modifiers;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").click(this._onSubmit.bind(this));
    html.find(".cancel-button").click(this._onCancel.bind(this));

    html.find(".defense-base-dr .radio-input").on("change", this._onDefenseDrRadioInputChanged.bind(this));
    html.find("#defendDr").on("change", this._onDefenseDrInputChanged.bind(this));
    html.find("#defendDr").trigger("change");

    html.find(".incoming-attack .radio-input").on("change", this._onIncomingAttackRadioInputChanged.bind(this));
    html.find("#incomingAttack").on("change", this._onIncomingAttackInputChanged.bind(this));
    
    html.find("#defendArmor").on("change", this._onDefendArmorRadioInputChanged.bind(this));
  }

  _onDefenseDrRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#defendDr").val(input.val());
    this.element.find("#defendDr").trigger("change");
  }

  async _onDefenseDrInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_DR, input.val());  
    const modifiedDr = parseInt(input.val(), 10) + this.modifiers.total;
    this.element.find("#defenseModifiedDr").val(modifiedDr);  
    $('.defense-base-dr .radio-input').val([input.val()]);  
  }

  _onIncomingAttackRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#incomingAttack").val(input.val());
    this.element.find("#incomingAttack").trigger("change");
  }

  async _onIncomingAttackInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.INCOMING_ATTACK, input.val());
    $('.incoming-attack .radio-input').val([input.val()]);  
  }

  async _onDefendArmorRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_ARMOR, input.val());
    this.element.find("#defendArmor").val(input.val());
  }

  _onCancel(event) {
    event.preventDefault();
    this.close();
  }

  _validate({ incomingAttack, defendDR, defendArmor } = {}) {
    if (incomingAttack && defendDR && defendArmor && (this.enforceTargetSelection ? this.isTargetSelectionValid : true)) {
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
    const baseDr = $(form).find("#defendDr").val();
    const incomingAttack = $(form).find("#incomingAttack").val();
    const defendDR = $(form).find("#defenseModifiedDr").val();
    const defendArmor = $(form).find("#defendArmor").val();

    if (!this._validate({ incomingAttack, defendDR, defendArmor })) {
      return;
    }   

    this.callback({
      incomingAttack,
      defendDR: parseInt(defendDR, 10),
      defendArmor,
      targetToken: this.targetToken,
    });
    this.close();
  }
}

/**
 * @param {Object} data
 * @param {Actor} data.actor
 * @returns {Promise.<{incomingAttack: String, defendDR: Number, defendArmor: string, targetToken: Token}>}
 */
export const showDefendDialog = (data = {}) => {
  return new Promise((resolve) => {
    new DefendDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
};
