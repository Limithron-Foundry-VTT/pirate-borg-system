import { findTargettedToken, hasTargets, isTargetSelectionValid, registerTargetAutomationHook, unregisterTargetAutomationHook } from "../api/targeting.js";
import { isEnforceTargetEnabled } from "../system/settings.js";
import { getSystemFlag, setSystemFlag } from "../api/utils.js";

const DEFEND_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/defend-dialog.html";

class DefendDialog extends Application {
  constructor({ actor, callback } = {}) {
    super();
    this.actor = actor;
    this.callback = callback;
    this.modifiers = this._getModifiers();

    this.enforceTargetSelection = isEnforceTargetEnabled() && this.actor.isInCombat;
    this.isTargetSelectionValid = isTargetSelectionValid();
    this.hasTargets = hasTargets();
    this._ontargetChangedHook = registerTargetAutomationHook(this._onTargetChanged.bind(this));
    this.targetToken = findTargettedToken();
    this._ontargetChangedHook = registerTargetAutomationHook(this._onTargetChanged.bind(this));
    this.ignoreArmor = this._shouldIgnoreArmor();
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
  async getData(options) {
    const data = super.getData(options);
    const defendDR = (await getSystemFlag(this.actor, CONFIG.PB.flags.DEFEND_DR)) ?? 12;
    const defendArmor = this.ignoreArmor ? 0 : await this._getDefendArmor();
    const incomingAttack = await this._getIncomingAttack();

    return {
      ...data,
      config: CONFIG.pirateborg,
      incomingAttack,
      defendDR,
      defendArmor,
      drModifiers: this.modifiers.warning,
      target: this.targetToken?.actor,
      ignoreArmor: this.ignoreArmor,
      isTargetSelectionValid: this.isTargetSelectionValid,
      shouldShowTarget: this._shouldShowTarget(),
      hasTargetWarning: this._hasTargetWarning(),
    };
  }

  async _getDefendArmor() {
    return (await getSystemFlag(this.actor, CONFIG.PB.flags.DEFEND_ARMOR)) ?? this.actor.equippedArmor?.damageReductionDie ?? 0;
  }

  async _getIncomingAttack() {
    if (this.targetToken) {
      return this.targetToken.actor.getActorAttackFormula();
    }
    return (await getSystemFlag(this.actor, CONFIG.PB.flags.INCOMING_ATTACK)) ?? "1d4";
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

  _shouldIgnoreArmor() {
    return this.targetToken?.actor.isAnyVehicle ?? false;
  }

  _onTargetChanged() {
    this.targetToken = findTargettedToken();
    this.isTargetSelectionValid = isTargetSelectionValid();
    this.hasTargets = hasTargets();
    this.ignoreArmor = this._shouldIgnoreArmor();
    this.render();
  }

  _getModifiers() {
    const modifiers = {
      total: 0,
      warning: [],
    };
    const armor = this.actor.equippedArmor;
    if (armor) {
      const { defenseModifier } = CONFIG.PB.armorTiers[armor.tier.max];
      if (defenseModifier) {
        modifiers.total += defenseModifier;
        modifiers.warning.push(`${armor.name}: ${game.i18n.localize("PB.DR")} + ${defenseModifier}`);
      }
    }
    if (this.actor.isEncumbered) {
      modifiers.total += 2;
      modifiers.warning.push(`${game.i18n.localize("PB.Encumbered")}: ${game.i18n.localize("PB.DR")} + 2`);
    }
    return modifiers;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").on("click", this._onSubmit.bind(this));
    html.find(".cancel-button").on("click", this._onCancel.bind(this));

    html.find(".defense-base-dr .radio-input").on("change", this._onDefenseDrRadioInputChanged.bind(this));
    html.find("#defendDr").on("change", this._onDefenseDrInputChanged.bind(this));
    html.find("#defendDr").trigger("change");

    html.find(".incoming-attack .radio-input").on("change", this._onIncomingAttackRadioInputChanged.bind(this));
    html.find("#incomingAttack").on("change", this._onIncomingAttackInputChanged.bind(this));

    html.find("#defendArmor").on("change", this._onDefendArmorRadioInputChanged.bind(this));
    html.find("#ignoreArmor").on("change", this._onIgnoreArmorChanged.bind(this));
  }

  async _onIgnoreArmorChanged(event) {
    const form = $(event.currentTarget).parents("form")[0];
    const input = $(event.currentTarget);
    this.ignoreArmor = input.prop("checked");
    $(form)
      .find("#defendArmor")
      .val(this.ignoreArmor ? 0 : await this._getDefendArmor());
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
    await setSystemFlag(this.actor, CONFIG.PB.flags.DEFEND_DR, input.val());
    const modifiedDr = parseInt(input.val(), 10) + this.modifiers.total;
    this.element.find("#defenseModifiedDr").val(modifiedDr);
    $(".defense-base-dr .radio-input").val([input.val()]);
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
    await setSystemFlag(this.actor, CONFIG.PB.flags.INCOMING_ATTACK, input.val());
    $(".incoming-attack .radio-input").val([input.val()]);
  }

  async _onDefendArmorRadioInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    await setSystemFlag(this.actor, CONFIG.PB.flags.DEFEND_ARMOR, input.val());
    this.element.find("#defendArmor").val(input.val());
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  _validate({ incomingAttack, defendDR, defendArmor } = {}) {
    return !!(incomingAttack && defendDR && defendArmor && (this.enforceTargetSelection ? this.isTargetSelectionValid : true));
  }

  /**
   * @override
   * @param [options]
   */
  async close(options) {
    unregisterTargetAutomationHook(this._ontargetChangedHook);
    await super.close(options);
  }

  async _onSubmit(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents("form")[0];
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
    await this.close();
  }
}

/**
 * @param {Object} data
 * @param {Actor} data.actor
 * @returns {Promise.<{incomingAttack: String, defendDR: Number, defendArmor: string, targetToken: Token}>}
 */
export const showDefendDialog = (data = {}) =>
  new Promise((resolve) => {
    new DefendDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
