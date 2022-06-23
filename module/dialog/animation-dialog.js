const DEFEND_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/animation-dialog.html";

class AnimationDialog extends Application {
  constructor({ entity, callback } = {}) {
    super();
    this.entity = entity;
    this.callback = callback;
    this.animationTypes = ["/Ranged/", "/Melee/", "/Unarmed_Attacks/", "/Creature/"];
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["animation-dialog"],
      template: DEFEND_DIALOG_TEMPLATE,
      title: game.i18n.localize("PB.Animation"),
      width: 460,
      height: "auto",
    });
  }

  /** @override */
  async getData(options) {
    const data = super.getData(options);
    data.config = CONFIG.pirateborg;
    data.animations = this._getAnimationEntries();
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").on("click", this._onSubmit.bind(this));
    html.find(".cancel-button").on("click", this._onCancel.bind(this));
  }

  _getAnimationEntries() {
    return Sequencer.Database.getEntry("jb2a")
      .filter((file) => this._isAnimationIncludes(file))
      .map((file) => file.dbPath);
  }

  _isAnimationIncludes(sequencerFile) {
    const file = sequencerFile.getAllFiles().pop();
    return this.animationTypes.some((animationType) => file.includes(animationType));
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  async _onSubmit(event) {
    event.preventDefault();
    // const form = $(event.currentTarget).parents("form")[0];

    this.callback({});
    await this.close();
  }
}

/**
 * @param {Object} data
 * @param {PBItem} data.item
 * @returns {Promise}
 */
export const showAnimationDialog = (data = {}) =>
  new Promise((resolve) => {
    new AnimationDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
