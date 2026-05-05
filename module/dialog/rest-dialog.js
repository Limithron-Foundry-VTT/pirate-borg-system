const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const REST_DIALOG_TEMPLATE = "systems/pirateborg/templates/dialog/rest-dialog.html";

class RestDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({ actor, callback } = {}) {
    super();
    this.actor = actor;
    this.callback = callback;
  }

  static DEFAULT_OPTIONS = {
    id: "rest-dialog",
    classes: ["custom-dialog", "rest-dialog"],
    window: { title: "PB.Rest" },
    position: { width: 420, height: "auto" },
  };

  static PARTS = {
    main: { template: REST_DIALOG_TEMPLATE },
  };

  async _prepareContext() {
    return {};
  }

  _onRender() {
    this.element.querySelector(".rest-button")?.addEventListener("click", this._onRest.bind(this));
    this.element.querySelector(".cancel-button")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.close();
    });
  }

  async _onRest(event) {
    event.preventDefault();
    const restLength = this.element.querySelector("input[name=rest-length]:checked")?.value;
    const foodAndDrink = this.element.querySelector("input[name=food-and-drink]:checked")?.value;
    const infected = this.element.querySelector("input[name=infected]")?.checked ?? false;
    this.callback({ restLength, foodAndDrink, infected });
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
    new RestDialog({ ...data, callback: resolve }).render({ force: true });
  });
