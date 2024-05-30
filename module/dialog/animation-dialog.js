import { getSystemFlag, setSystemFlag } from "../api/utils.js";

const DEFEND_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/animation-dialog.html";

class AnimationDialog extends Application {
  /**
   * @param {foundry.abstract.Document} document
   */
  constructor(document) {
    super();
    this.document = document;
    this.animationTypes = ["/Ranged/", "/Melee/", "/Unarmed_Attacks/", "/Creature/"];
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
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
    data.animations = this.getAnimations();
    data.selectedAnimation = getSystemFlag(this.document, CONFIG.PB.flags.ANIMATION);
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").on("click", this._onSubmit.bind(this));
    html.find(".cancel-button").on("click", this._onCancel.bind(this));
  }

  getAnimations() {
    if (typeof Sequencer === "undefined") return [];
    return Sequencer.Database.getEntry("jb2a")
      .filter((sequencerFile) => {
        const file = sequencerFile.getAllFiles().pop();
        return this.animationTypes.some((animationType) => file.includes(animationType));
      })
      .map((sequencerFile) => sequencerFile.dbPath)
      .map((dbPath) => {
        const lastPart = dbPath.split(".").pop();
        const hasMultipleAnimations = !isNaN(lastPart);
        return hasMultipleAnimations ? dbPath.substring(0, dbPath.lastIndexOf(".")) : dbPath;
      })
      .filter((dbPath, index, arr) => arr.indexOf(dbPath) === index);
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  async _onSubmit(event) {
    event.preventDefault();
    const animation = this.element.find("[name=itemtype").val();

    await setSystemFlag(this.document, CONFIG.PB.flags.ANIMATION, animation);
    await this.close();
  }
}

/**
 * @param {foundry.abstract.Document} document
 */
export const showAnimationDialog = (document) => {
  const animationDialog = new AnimationDialog(document);
  animationDialog.render(true);
};
