import { getSystemFlag, setSystemFlag } from "../api/utils.js";
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const ANIMATION_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/animation-dialog.html";

class AnimationDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(document) {
    super();
    this.document = document;
    this.animationTypes = ["/Ranged/", "/Melee/", "/Unarmed_Attacks/", "/Creature/"];
  }

  static DEFAULT_OPTIONS = {
    classes: ["animation-dialog"],
    window: { title: "PB.Animation" },
    position: { width: 460, height: "auto" },
  };

  static PARTS = {
    main: { template: ANIMATION_DIALOG_TEMPLATE },
  };

  async _prepareContext() {
    return {
      config: CONFIG.pirateborg,
      animations: this.getAnimations(),
      selectedAnimation: getSystemFlag(this.document, CONFIG.PB.flags.ANIMATION),
    };
  }

  _onRender() {
    this.element.querySelector(".ok-button")?.addEventListener("click", this._onSubmit.bind(this));
    this.element.querySelector(".cancel-button")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.close();
    });
  }

  getAnimations() {
    if (typeof Sequencer === "undefined") return [];
    const jb2a = Sequencer.Database.getEntry("jb2a");
    if (!jb2a) {
      ui.notifications.error(game.i18n.localize("PB.AnimationMissingJB2A"), { permanent: true });
      return [];
    }

    return jb2a
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

  async _onSubmit(event) {
    event.preventDefault();
    const animation = this.element.querySelector("[name=itemtype]")?.value;
    await setSystemFlag(this.document, CONFIG.PB.flags.ANIMATION, animation);
    await this.close();
  }
}

/**
 * @param {foundry.abstract.Document} document
 */
export const showAnimationDialog = (document) => {
  new AnimationDialog(document).render({ force: true });
};
