/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

import { StairwayLayer } from "./StairwayLayer.js";
import { StairwayDocument } from "./StairwayDocument.js";
import { Stairway } from "./Stairway.js";
import { StairwayControl } from "./StairwayControl.js";
import { StairwayConfig } from "./StairwayConfig.js";
import { BaseStairway } from "./BaseStairway.js";

const fields = foundry.data.fields;

export const injectStairways = () => {
  // register stairway classes
  CONFIG.Stairway = {
    documentClass: StairwayDocument,
    objectClass: Stairway,
    layerClass: StairwayLayer,
    sheetClasses: {},
  };

  // Add Stairway to documentTypes
  const origDocumentTypesGetter = Object.getOwnPropertyDescriptor(
    Game.prototype,
    "documentTypes"
  ).get;
  Object.defineProperty(Game.prototype, "documentTypes", {
    get: function () {
      return {
        ...origDocumentTypesGetter.call(this),
        Stairway: ["base"],
      };
    },
  });

  // Register sheet
  DocumentSheetConfig.registerSheet(StairwayDocument, "pirateborg", StairwayConfig, {
    makeDefault: true,
    types: ["base"],
  });

  hookCanvas();
  hookBaseScene();
  hookControlsLayer();
  hookTokenLayer();

  // add stairways as embedded document for existing scenes
  for (const scene of game.data.scenes) {
    scene.stairways = foundry.utils.duplicate(
      scene.flags?.pirateborg?.stairways ?? []
    );
  }
};

const hookCanvas = () => {
  // inject StairwayLayer into the canvas layers list
  const origLayers = CONFIG.Canvas.layers;
  CONFIG.Canvas.layers = Object.keys(origLayers).reduce((layers, key) => {
    layers[key] = origLayers[key];

    // inject stairways layer after walls
    if (key === "walls") {
      layers.stairways = {
        layerClass: StairwayLayer,
        group: "interface",
      };
    }

    return layers;
  }, {});

  // Workaround for incomplete layer injection by other modules
  if (!Object.is(Canvas.layers, CONFIG.Canvas.layers)) {
    console.warn(
      "Pirate Borg Stairways | Possible incomplete layer injection detected, applying workaround..."
    );

    const layers = Canvas.layers;
    Object.defineProperty(Canvas, "layers", {
      get: function () {
        return foundry.utils.mergeObject(CONFIG.Canvas.layers, layers);
      },
    });
  }

  // Hook the Canvas.getLayerByEmbeddedName
  const origGetLayerByEmbeddedName = Canvas.prototype.getLayerByEmbeddedName;
  Canvas.prototype.getLayerByEmbeddedName = function (embeddedName) {
    if (embeddedName === "Stairway") {
      return this.stairways;
    } else {
      return origGetLayerByEmbeddedName.call(this, embeddedName);
    }
  };
};

const hookBaseScene = () => {
  // inject Stairway into scene metadata
  const BaseScene = foundry.documents.BaseScene;

  Object.defineProperty(BaseScene.prototype.constructor, "stairways", {
    value: [],
  });

  const sceneMetadata = Object.getOwnPropertyDescriptor(
    BaseScene.prototype.constructor,
    "metadata"
  );
  // Hook the BaseScene#metadata getter
  Object.defineProperty(BaseScene.prototype.constructor, "metadata", {
    value: Object.freeze(
      foundry.utils.mergeObject(
        sceneMetadata.value,
        {
          embedded: {
            Stairway: "stairways",
          },
        },
        { inplace: false }
      )
    ),
  });

  // inject BaseStairway into BaseScene schema
  const defineSchema = BaseScene.prototype.constructor.defineSchema;

  // Hook the BaseScene#defineSchema method
  BaseScene.prototype.constructor.defineSchema = function () {
    const schema = defineSchema();

    // inject stairways schema once
    if (!schema.stairways) {
      schema.stairways = new fields.EmbeddedCollectionField(BaseStairway);
    }

    return schema;
  };
};

const hookControlsLayer = () => {
  // Hook ControlsLayer.draw
  const origDraw = ControlsLayer.prototype._draw;
  ControlsLayer.prototype._draw = function () {
    this.drawStairways();
    origDraw.call(this);
  };

  ControlsLayer.prototype.drawStairways = function () {
    // Create the container
    if (this.stairways) this.stairways.destroy({ children: true });
    this.stairways = this.addChild(new PIXI.Container());

    // Iterate over all stairways
    if (canvas.stairways?.placeables) {
      for (const stairway of canvas.stairways.placeables) {
        this.createStairwayControl(stairway);
      }
    }

    if (canvas.stairways) {
      this.stairways.visible = !canvas.stairways.active;
    }
  };

  ControlsLayer.prototype.createStairwayControl = function (stairway) {
    const sw = this.stairways.addChild(new StairwayControl(stairway));
    sw.visible = false;
    sw.draw();
  };
};

const hookTokenLayer = () => {
  // Hook TokenLayer.activate / deactivate
  const origActivate = TokenLayer.prototype.activate;
  TokenLayer.prototype.activate = function () {
    origActivate.call(this);
    if (canvas.controls?.stairways) canvas.controls.stairways.visible = true;
  };

  const origDeactivate = TokenLayer.prototype.deactivate;
  TokenLayer.prototype.deactivate = function () {
    origDeactivate.call(this);
    if (canvas.controls?.stairways) canvas.controls.stairways.visible = false;
  };
};
