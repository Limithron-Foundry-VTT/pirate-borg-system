/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

import { Stairway } from "./Stairway.js";
import { StairwayDocument } from "./StairwayDocument.js";

// Between WallsLayer (40) and TemplateLayer (50)
const STAIRWAY_LAYER_ZINDEX = 45;

/**
 * The Stairway Layer which displays stairway icons within the rendered Scene.
 * @extends {PlaceablesLayer}
 */
export class StairwayLayer extends PlaceablesLayer {
  /**
   * Toggle for animate new stairways
   * @type {boolean}
   */
  _animate = false;

  /**
   * Toggle for disable new stairways
   * @type {boolean}
   */
  _disabled = false;

  /**
   * Toggle for hide new stairways
   * @type {boolean}
   */
  _hidden = false;

  /** @inheritdoc */
  static get documentName() {
    return "Stairway";
  }

  /** @override */
  static get layerOptions() {
    return foundry.utils.mergeObject(super.layerOptions, {
      name: "stairways",
      canDragCreate: false,
      canDelete: game.user.isGM,
      controllableObjects: false,
      rotatableObjects: false,
      snapToGrid: true,
      gridPrecision: 2,
      zIndex: STAIRWAY_LAYER_ZINDEX,
    });
  }

  /* -------------------------------------------- */

  /** @override */
  activate() {
    console.log("StairwayLayer.activate called");
    return super.activate();
  }

  /* -------------------------------------------- */

  static getConnectionTarget() {
    // name of stairway (used for connection)
    let connectionTarget;

    if (Stairway.connectionTarget) {
      // use name and scene of connection target
      connectionTarget = Stairway.connectionTarget;
      Stairway.resetConnectionTarget();
    } else {
      // auto generate new name, set current scene
      connectionTarget = foundry.utils.duplicate(Stairway.setConnectionTarget());
    }

    // don't use a specific scene if both stairways are on the same scene
    if (connectionTarget.scene === canvas.scene.id) {
      connectionTarget.scene = null;
    }

    return connectionTarget;
  }

  /* -------------------------------------------- */

  /**
   * Delete all stairways from the current scene
   */
  async deleteAll() {
    if (!game.user.isGM) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("STAIRWAYS.ClearAllTitle") },
      content: game.i18n.localize("STAIRWAYS.ClearAllContent"),
    });

    if (confirmed) {
      const ids = this.placeables.map((s) => s.id);
      await canvas.scene.deleteEmbeddedDocuments("Stairway", ids);
    }
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /** @override */
  _onClickLeft(event) {
    console.log("StairwayLayer._onClickLeft called", event);
    super._onClickLeft(event);

    // snap the origin to grid when shift isn't pressed
    const { originalEvent } = event.data;
    if (this.options.snapToGrid && !originalEvent.shiftKey) {
      const { origin } = event.interactionData;
      event.interactionData.origin = this.getSnappedPoint(origin);
    }

    // position
    const { origin } = event.interactionData;
    console.log("StairwayLayer._onClickLeft: origin =", origin);

    // get options from layer control
    const animate = this._animate === true;
    const disabled = this._disabled === true;
    const hidden = this._hidden === true;

    try {
      // create new stairway
      const connectionTarget = StairwayLayer.getConnectionTarget();
      console.log("StairwayLayer._onClickLeft: connectionTarget =", connectionTarget);
      
      const docData = {
        ...connectionTarget,
        disabled,
        hidden,
        animate,
        x: origin.x,
        y: origin.y,
        _id: foundry.utils.randomID(16),
      };
      console.log("StairwayLayer._onClickLeft: docData =", docData);
      
      const doc = new StairwayDocument(docData, { parent: canvas.scene });
      console.log("StairwayLayer._onClickLeft: doc =", doc);
      
      const stairway = new Stairway(doc);
      console.log("StairwayLayer._onClickLeft: stairway =", stairway);
      
      const createData = stairway.document.toObject(false);
      console.log("StairwayLayer._onClickLeft: createData =", createData);
      
      return StairwayDocument.create(createData, { parent: canvas.scene })
        .then((result) => {
          console.log("StairwayLayer._onClickLeft: created =", result);
          return result;
        })
        .catch((err) => {
          console.error("StairwayLayer._onClickLeft: create error =", err);
        });
    } catch (err) {
      console.error("StairwayLayer._onClickLeft: error =", err);
    }
  }

  /* -------------------------------------------- */

  static onPasteStairway(_copy, toCreate) {
    // only one stairway should be pasteable at once, warn if we got more
    if (toCreate.length > 1) {
      console.error("more than one stairway was pasted", _copy, toCreate);
      ui.notifications.error(
        game.i18n.localize("STAIRWAYS.Messages.InternalError")
      );
    }

    // set correct connection target on paste
    for (const stairway of toCreate) {
      const connectionTarget = StairwayLayer.getConnectionTarget();
      for (const key in connectionTarget) {
        stairway[key] = connectionTarget[key];
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _onDragLeftStart(...args) {}

  /* -------------------------------------------- */

  /** @override */
  _onDragLeftDrop(...args) {}

  /* -------------------------------------------- */

  /** @override */
  _onDragLeftMove(...args) {}

  /* -------------------------------------------- */

  /** @override */
  _onDragLeftCancel(...args) {}
}
