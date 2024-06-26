const REST_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/rest-dialog.html";

class RestDialog extends Application {
  constructor({ actor, callback } = {}) {
    super();
    this.actor = actor;
    this.callback = callback;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "rest-dialog",
      classes: ["custom-dialog", "rest-dialog"],
      template: REST_DIALOG_TEMPLATE,
      title: game.i18n.localize("PB.Rest"),
      width: 420,
      height: "auto",
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".rest-button").on("click", this._onRest.bind(this));
    html.find(".cancel-button").on("click", this._onCancel.bind(this));
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  async _onRest(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".rest-dialog")[0];
    const restLength = $(form).find("input[name=rest-length]:checked").val();
    const foodAndDrink = $(form).find("input[name=food-and-drink]:checked").val();
    const infected = $(form).find("input[name=infected]").is(":checked");
    this.callback({
      restLength,
      foodAndDrink,
      infected,
    });
    await this.close();
  }
}

/**
 * @param {Object} data
 * @param {Actor} data.actor
 * @returns {Promise.<{restLength: String, foodAndDrink: String, infected: Boolean}>}
 */
export const showRestDialog = (data = {}) =>
  new Promise((resolve) => {
    new RestDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
