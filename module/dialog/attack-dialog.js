const ATTACK_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/attack-dialog.html";

class AttackDialog extends Application {
  constructor({ actor, callback } = {}) {
    super();
    this.actor = actor;
    this.callback = callback;
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
    const targetArmor = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.TARGET_ARMOR)) ?? 0;

    return {
      config: CONFIG.pirateborg,
      attackDR,
      targetArmor,
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").click(this._onSubmit.bind(this));
    html.find(".cancel-button").click(this._onCancel.bind(this));
    html.find(".attack-dr .radio-input").on("change", this._onAttackDrInputChanged.bind(this));
    html.find(".armor-tier .radio-input").on("change", this._onArmorTierInputChanged.bind(this));
  }

  _onArmorTierInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#targetArmor").val(input.val());
  }

  _onAttackDrInputChanged(event) {
    event.preventDefault();
    const input = $(event.currentTarget);
    this.element.find("#attackDr").val(input.val());
  }

  _onCancel(event) {
    event.preventDefault();
    this.close();
  }

  _validate({ targetArmor, attackDR }) {
    if (targetArmor && attackDR) {
      return true;
    }
    return false;
  }

  async _onSubmit(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents("form")[0];
    const targetArmor = $(form).find("#targetArmor").val();
    const attackDR = $(form).find("#attackDr").val();

    if (!this._validate({ targetArmor, attackDR })) {
      return;
    }

    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.ATTACK_DR, attackDR);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.TARGET_ARMOR, targetArmor);

    this.callback({
      targetArmor,
      attackDR: parseInt(attackDR, 10),
    });
    this.close();
  }
}

/**
 * @param {Object} data
 * @param {Actor} data.actor
 * @returns {Promise.<{targetArmor: String, attackDR: Number}>}
 */
export const showAttackDialog = (data = {}) => {
  return new Promise((resolve) => {
    new AttackDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
};
