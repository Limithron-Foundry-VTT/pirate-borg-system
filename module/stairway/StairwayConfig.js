/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

import { StairwayDocument } from "./StairwayDocument.js";

export const STAIRWAY_DEFAULTS = {
  scene: "null",
  icon: "systems/pirateborg/icons/stairways/stairway.svg",
  width: 0.4,
  height: 0.4,
  fontFamily: CONFIG.defaultFontFamily,
  fontSize: 24,
  textColor: "#FFFFFF",
};
export const NO_RESET_DEFAULT = ["name", "scene", "x", "y"];

export const COLOR = {
  onScene: 0x000000,
  onTargetScene: 0x000080,
  noPartnerOtherScene: 0xffbf00,
  noPartner: 0xffbf00,
  nonMonogamous: 0xde3264,
};

/**
 * Stairway Configuration Sheet
 * @implements {DocumentSheet}
 *
 * @param stairway {Stairway} The Stairway object for which settings are being configured
 * @param options {Object}     StairwayConfig ui options (see Application)
 */
export class StairwayConfig extends DocumentSheet {
  /** @inheritdoc */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "stairway-config",
      classes: ["sheet", "stairway-sheet"],
      title: "STAIRWAYS.ConfigTitle",
      template: "systems/pirateborg/templates/stairway/stairway-config.hbs",
      width: 480,
      height: "auto",
      tabs: [
        { navSelector: ".tabs", contentSelector: "form", initial: "main" },
      ],
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async _render(force, options) {
    if (!this.rendered) this.original = this.object.clone({}, { keepId: true });
    return super._render(force, options);
  }

  /* -------------------------------------------- */

  /** @override */
  getData(options) {
    const data = super.getData(options);
    const scenes = {
      null: game.i18n.localize("STAIRWAYS.CurrentScene"),
    };
    for (const scene of game.scenes) {
      scenes[scene.id] = scene.name;
    }

    const iconName = (name) =>
      game.i18n.localize(`STAIRWAYS.Icons.${name}`);
    const icons = {
      [STAIRWAY_DEFAULTS.icon]: iconName("Stairway"),
      "icons/svg/door-steel.svg": iconName("DoorSteel"),
      "icons/svg/door-closed.svg": iconName("DoorClosed"),
      "icons/svg/door-exit.svg": iconName("DoorExit"),
      "icons/svg/cave.svg": iconName("Cave"),
      "icons/svg/house.svg": iconName("House"),
      "icons/svg/city.svg": iconName("City"),
      "icons/svg/castle.svg": iconName("Castle"),
    };

    const fontFamilies = Object.keys(CONFIG.fontDefinitions).reduce((obj, f) => {
      obj[f] = f;
      return obj;
    }, {});

    // replace null with defaults
    for (const key in STAIRWAY_DEFAULTS) {
      data.data[key] ??= STAIRWAY_DEFAULTS[key];
    }

    return {
      ...data,
      status: this.document.object?.status,
      scenes,
      icons,
      fontFamilies,
      submitText: game.i18n.localize("STAIRWAYS.Submit"),
    };
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    this.iconPicker = html.find('file-picker[name="icon"]')[0];
    html.find("img.select-icon").click(this._onSelectIcon.bind(this));
    html.find('button[name="resetDefault"]').click(this._onResetDefaults.bind(this));
  }

  /* -------------------------------------------- */

  _onSelectIcon(event) {
    const icon = event.currentTarget.attributes.src.value;
    this.iconPicker.value = icon;
    this.iconPicker.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /* -------------------------------------------- */

  /**
   * Reset the Stairway configuration settings to their default values
   * @param event
   * @private
   */
  _onResetDefaults(event) {
    event.preventDefault();

    const defaults = StairwayDocument.cleanData();

    for (const key in defaults) {
      // don't reset internal and required fields
      if (key.startsWith("_") || NO_RESET_DEFAULT.includes(key)) {
        delete defaults[key];
        continue;
      }

      // use default value or null
      defaults[key] = STAIRWAY_DEFAULTS[key] ?? null;
    }

    this._previewChanges(defaults);
    this.render();
  }

  /* -------------------------------------------- */

  /**
   * Preview changes to the Stairway document as if they were true document updates.
   * @param {object} change       Data which simulates a document update
   * @protected
   */
  _previewChanges(change) {
    this.object.updateSource(change);
    this.object._onUpdate(change, { render: false }, game.user.id);
  }

  /* -------------------------------------------- */

  /**
   * Restore the true data for the Stairway document when the form is submitted or closed.
   * @protected
   */
  _resetPreview() {
    this._previewChanges(this.original.toObject());
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async close(options = {}) {
    if (!options.force) this._resetPreview();
    return super.close(options);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  async _onChangeInput(event) {
    await super._onChangeInput(event);
    const previewData = this._getSubmitData();
    this._previewChanges(previewData);
  }

  /* -------------------------------------------- */

  /** @override */
  _getSubmitData(updateData = {}) {
    const formData = super._getSubmitData(updateData);

    // replace default values with null
    for (const key in STAIRWAY_DEFAULTS) {
      if (formData[key] === STAIRWAY_DEFAULTS[key]) {
        formData[key] = null;
      }
    }

    return formData;
  }

  /* -------------------------------------------- */

  /** @override */
  async _updateObject(event, formData) {
    this._resetPreview();
    if (this.object.id) return this.object.update(formData);
    return this.object.constructor.create(formData, { parent: canvas.scene });
  }
}
