import { findTargettedToken, hasTargets, isTargetSelectionValid, registerTargetAutomationHook, unregisterTargetAutomationHook } from "../api/targeting.js";
import { isEnforceTargetEnabled } from "../system/settings.js";
import { getSystemFlag, setSystemFlag } from "../api/utils.js";
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const DEFEND_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/defend-dialog.html";

class DefendDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({ actor, callback } = {}) {
    super();
    this.actor = actor;
    this.callback = callback;
    this.modifiers = this._getModifiers();

    this.enforceTargetSelection = isEnforceTargetEnabled() && this.actor.isInCombat;
    this.isTargetSelectionValid = isTargetSelectionValid();
    this.hasTargets = hasTargets();
    this.targetToken = findTargettedToken();
    this.ignoreArmor = this._shouldIgnoreArmor();
    this._ontargetChangedHook = registerTargetAutomationHook(this._onTargetChanged.bind(this));
  }

  static DEFAULT_OPTIONS = {
    classes: ["defend-dialog", "standard-form"],
    window: { title: "PB.Defend" },
    position: { width: 460, height: "auto" },
  };

  static PARTS = {
    main: { template: DEFEND_DIALOG_TEMPLATE },
  };

  async _prepareContext() {
    const defendDR = (await getSystemFlag(this.actor, CONFIG.PB.flags.DEFEND_DR)) ?? 12;
    const defendArmor = this.ignoreArmor ? 0 : await this._getDefendArmor();
    const incomingAttack = await this._getIncomingAttack();

    return {
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

  _onRender() {
    this.element.querySelector(".ok-button")?.addEventListener("click", this._onSubmit.bind(this));
    this.element.querySelector(".cancel-button")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.close();
    });

    this.element
      .querySelectorAll(".defense-base-dr .radio-input")
      .forEach((el) => el.addEventListener("change", this._onDefenseDrRadioInputChanged.bind(this)));
    const defendDrEl = this.element.querySelector("#defendDr");
    defendDrEl?.addEventListener("change", this._onDefenseDrInputChanged.bind(this));
    if (defendDrEl) defendDrEl.dispatchEvent(new Event("change"));

    this.element
      .querySelectorAll(".incoming-attack .radio-input")
      .forEach((el) => el.addEventListener("change", this._onIncomingAttackRadioInputChanged.bind(this)));
    this.element.querySelector("#incomingAttack")?.addEventListener("change", this._onIncomingAttackInputChanged.bind(this));

    this.element.querySelector("#defendArmor")?.addEventListener("change", this._onDefendArmorInputChanged.bind(this));
    this.element.querySelector("#ignoreArmor")?.addEventListener("change", this._onIgnoreArmorChanged.bind(this));
  }

  async _getDefendArmor() {
    return (await getSystemFlag(this.actor, CONFIG.PB.flags.DEFEND_ARMOR)) ?? this.actor.equippedArmor?.damageReductionDie ?? 0;
  }

  async _getIncomingAttack() {
    if (this.targetToken) return this.targetToken.actor.getActorAttackFormula();
    return (await getSystemFlag(this.actor, CONFIG.PB.flags.INCOMING_ATTACK)) ?? "1d4";
  }

  _hasTargetWarning() {
    return !!(this.enforceTargetSelection && !this.isTargetSelectionValid);
  }

  _shouldShowTarget() {
    return this.enforceTargetSelection || this.hasTargets;
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
    const modifiers = { total: 0, warning: [] };
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

  _onDefenseDrRadioInputChanged(event) {
    event.preventDefault();
    const defendDrEl = this.element.querySelector("#defendDr");
    if (defendDrEl) {
      defendDrEl.value = event.currentTarget.value;
      defendDrEl.dispatchEvent(new Event("change"));
    }
  }

  async _onDefenseDrInputChanged(event) {
    event.preventDefault();
    const value = event.currentTarget.value;
    await setSystemFlag(this.actor, CONFIG.PB.flags.DEFEND_DR, value);
    const modifiedDr = parseInt(value, 10) + this.modifiers.total;
    const modifiedDrEl = this.element.querySelector("#defenseModifiedDr");
    if (modifiedDrEl) modifiedDrEl.value = modifiedDr;
    this.element.querySelectorAll(".defense-base-dr .radio-input").forEach((el) => {
      el.checked = el.value === value;
    });
  }

  _onIncomingAttackRadioInputChanged(event) {
    event.preventDefault();
    const incomingAttackEl = this.element.querySelector("#incomingAttack");
    if (incomingAttackEl) {
      incomingAttackEl.value = event.currentTarget.value;
      incomingAttackEl.dispatchEvent(new Event("change"));
    }
  }

  async _onIncomingAttackInputChanged(event) {
    event.preventDefault();
    const value = event.currentTarget.value;
    await setSystemFlag(this.actor, CONFIG.PB.flags.INCOMING_ATTACK, value);
    this.element.querySelectorAll(".incoming-attack .radio-input").forEach((el) => {
      el.checked = el.value === value;
    });
  }

  async _onDefendArmorInputChanged(event) {
    event.preventDefault();
    await setSystemFlag(this.actor, CONFIG.PB.flags.DEFEND_ARMOR, event.currentTarget.value);
  }

  async _onIgnoreArmorChanged(event) {
    this.ignoreArmor = event.currentTarget.checked;
    const defendArmorEl = this.element.querySelector("#defendArmor");
    if (defendArmorEl) defendArmorEl.value = this.ignoreArmor ? 0 : await this._getDefendArmor();
  }

  _validate({ incomingAttack, defendDR, defendArmor } = {}) {
    return !!(incomingAttack && defendDR && defendArmor && (this.enforceTargetSelection ? this.isTargetSelectionValid : true));
  }

  async close(options) {
    unregisterTargetAutomationHook(this._ontargetChangedHook);
    await super.close(options);
  }

  async _onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget.closest("form");
    const incomingAttack = form.querySelector("#incomingAttack")?.value;
    const defendDR = form.querySelector("#defenseModifiedDr")?.value;
    const defendArmor = form.querySelector("#defendArmor")?.value;

    if (!this._validate({ incomingAttack, defendDR, defendArmor })) return;

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
    new DefendDialog({ ...data, callback: resolve }).render({ force: true });
  });
