const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

const ADD_ITEM_TEMPLATE = "systems/pirateborg/templates/dialog/add-item-dialog.html";

class AddItemDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({ callback } = {}) {
    super();
    this.callback = callback;
  }

  static DEFAULT_OPTIONS = {
    window: { title: "PB.CreateNewItem" },
    position: { width: 420, height: "auto" },
  };

  static PARTS = {
    main: { template: ADD_ITEM_TEMPLATE },
  };

  async _prepareContext() {
    return { config: CONFIG.pirateborg };
  }

  _onRender() {
    this.element.querySelector(".cancel-button")?.addEventListener("click", this._onCancel.bind(this));
    this.element.querySelector(".ok-button")?.addEventListener("click", this._onSubmit.bind(this));
  }

  async _onCancel(event) {
    event.preventDefault();
    await this.close();
  }

  async _onSubmit(event) {
    event.preventDefault();
    const name = this.element.querySelector("[name=itemname]")?.value;
    const type = this.element.querySelector("[name=itemtype]")?.value;
    if (!name || !type) return;
    this.callback({ name, type });
    await this.close();
  }
}

/**
 * @returns {Promise.<{name: String, type: String}>}
 */
export const showAddItemDialog = (data = {}) =>
  new Promise((resolve) => {
    new AddItemDialog({ ...data, callback: resolve }).render({ force: true });
  });
