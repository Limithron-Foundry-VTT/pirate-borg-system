const ADD_ITEM_TEMPLATE = "systems/pirateborg/templates/dialog/add-item-dialog.html";

class AddItemDialog extends Application {
  constructor({ callback } = {}) {
    super();
    this.callback = callback;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: ADD_ITEM_TEMPLATE,
      title: game.i18n.localize("PB.CreateNewItem"),
      width: 420,
      height: "auto",
    });
  }

  /** @override */
  async getData(options) {
    const data = super.getData(options);
    data.config = CONFIG.pirateborg;
    return data;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".cancel-button").on("click", this._onCancel.bind(this));
    html.find(".ok-button").on("click", this._onSubmit.bind(this));
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  async _onSubmit(event) {
    event.preventDefault();
    const name = this.element.find("[name=itemname]").val();
    const type = this.element.find("[name=itemtype]").val();

    if (!name || !type) {
      return;
    }

    this.callback({
      name,
      type,
    });
    await this.close();
  }
}

/**
 * @returns {Promise.<{name: String, type: String}>}
 */
export const showAddItemDialog = (data = {}) =>
  new Promise((resolve) => {
    new AddItemDialog({
      ...data,
      callback: resolve,
    }).render(true);
  });
