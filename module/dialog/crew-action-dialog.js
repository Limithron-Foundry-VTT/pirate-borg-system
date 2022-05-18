const SHIP_CREW_ACTION_TEMPLATE = "systems/pirateborg/templates/dialog/ship-crew-action-dialog.html";

class CrewActionDialog extends Application {
  constructor(data = {}) {
    super(data);
    this.actor = data.actor;
    this.enableCrewSelection = data.enableCrewSelection;
    this.enableDrSelection = data.enableDrSelection;
    this.enableArmorSelection = data.enableArmorSelection;
    this.callback = data.callback;
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["crew-action-dialog"],
      template: SHIP_CREW_ACTION_TEMPLATE,
      title: game.i18n.localize("PB.ShipCrewAction"),
      width: 420,
      height: "auto",
    });
  }

  /** @override */
  async getData() {
    const selectedCrewId = await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.SELECTED_CREW);
    const selectedDR = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.ATTACK_DR)) || "12";
    const selectedArmor = (await this.actor.getFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.TARGET_ARMOR)) || "0";

    return {
      config: CONFIG.pirateborg,
      crews: this.actor.crews.map((actorId) => game.actors.get(actorId).data),
      enableCrewSelection: this.enableCrewSelection,
      enableDrSelection: this.enableDrSelection,
      enableArmorSelection: this.enableArmorSelection,
      selectedDR,
      selectedCrewId,
      selectedArmor,
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ok-button").click(this.onSubmit.bind(this));

    html.find(".dr .radio-input").on("change", (event) => {
      event.preventDefault();
      const input = $(event.currentTarget);
      html.find("#dr").val(input.val());
    });

    html.find(".armor-tier .radio-input").on("change", (event) => {
      event.preventDefault();
      const input = $(event.currentTarget);
      html.find("#targetArmor").val(input.val());
    });
  }

  async onSubmit(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents("form")[0];

    const selectedCrewId = $(form).find("#crewActor").val();
    const selectedDR = $(form).find("#dr").val();
    const selectedArmor = $(form).find("#targetArmor").val();

    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.SELECTED_CREW, selectedCrewId);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.ATTACK_DR, selectedDR);
    await this.actor.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.TARGET_ARMOR, selectedArmor);

    this.callback({
      selectedActor: game.actors.get(selectedCrewId),
      selectedDR: parseInt(selectedDR, 10),
      selectedArmor: selectedArmor,
    });
    this.close();
  }
}

/**
 * @param {Object} data
 * @returns {Promise.<{selectedActor: Actor, selectedDR: Number, selectedArmor: String}>}
 */
export const showCrewActionDialog = (data = {}) => {
  return new Promise((resolve) => {
    new CrewActionDialog({
      ...data,
      callback: (result) => {
        console.log(result);
        resolve(result);
      },
    }).render(true);
  });
};
