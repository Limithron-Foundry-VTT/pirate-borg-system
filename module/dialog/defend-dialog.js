const DEFEND_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/defend-dialog.html";

class DefendDialog extends Application {
  constructor({ actor, callback } = {}) {
    super();
    this.actor = actor;
    this.armir = actor;
    this.callback = callback;
    this.modifiers = this._getModifiers();
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
    const incomingAttack = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.INCOMING_ATTACK)) ?? "1d4";
    const defendDR = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_DR)) ?? 12;
    const defendArmor = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_ARMOR)) ?? this._getArmorDamageReductionDie();
    return {
      config: CONFIG.pirateborg,
      incomingAttack,
      defendDR,
      defendArmor,
      drModifiers: this.modifiers.warning,
    };
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
    html.find(".defense-base-dr .radio-input").on("change", this._onDefenseDrInputChanged.bind(this));
    html.find(".incoming-attack .radio-input").on("change", this._onIncomingAttackInputChanged.bind(this));
    html.find(".defend-armor .radio-input").on("change", this._onDefendArmorInputChanged.bind(this));
    html.find("#defendDr").on("change", this._onDefenseBaseDRChange.bind(this));
    html.find("#defendDr").trigger("change");
  }

  _onDefenseDrInputChanged(event) {
    ///event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#defendDr").val(input.val());
    this.element.find("#defendDr").trigger("change");
  }

  _onIncomingAttackInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#incomingAttack").val(input.val());
  }

  _onDefendArmorInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#defendArmor").val(input.val());
  }

  _onDefenseBaseDRChange(event) {
    console.log("_onDefenseBaseDRChange");
    event.preventDefault();
    const input = $(event.currentTarget);
    const modifiedDr = parseInt(input.val(), 10) + this.modifiers.total;
    this.element.find("#defenseModifiedDr").val(modifiedDr);
  }

  _onCancel(event) {
    event.preventDefault();
    this.close();
  }

  _validate({ incomingAttack, defendDR, defendArmor } = {}) {
    if (incomingAttack && defendDR && defendArmor) {
      return true;
    }
    return false;
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

    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_DR, baseDr);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.INCOMING_ATTACK, incomingAttack);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_ARMOR, defendArmor);

    this.callback({
      incomingAttack,
      defendDR: parseInt(defendDR, 10),
      defendArmor,
    });
    this.close();
  }
}

/**
 * @param {Object} data
 * @param {Actor} data.actor
 * @returns {Promise.<{incomingAttack: String, defendDR: Number, defendArmor: string}>}
 */
export const showDefendDialog = (data = {}) => {
  return new Promise((resolve) => {
    new DefendDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
};
