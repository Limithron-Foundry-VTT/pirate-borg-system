/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

import { COLOR, STAIRWAY_DEFAULTS } from "./StairwayConfig.js";
import { StairwayControlIcon } from "./StairwayControlIcon.js";

/**
 * A Stairway is an implementation of PlaceableObject which represents a teleport between two points.
 * @extends {PlaceableObject}
 */
export class Stairway extends PlaceableObject {
  /**
   * A reference to the ControlIcon used to configure this stairway
   * @type {StairwayControlIcon}
   */
  // controlIcon

  /* -------------------------------------------- */

  /** @inheritdoc */
  static get embeddedName() {
    return "Stairway";
  }

  /** @override */
  static get RENDER_FLAGS() {
    return {
      redraw: { propagate: ["refresh"] },
      refresh: { propagate: ["refreshField"], alias: true },
      refreshField: { propagate: ["refreshPosition", "refreshState"] },
      refreshPosition: {},
      refreshState: {},
    };
  }

  static setConnectionTarget(
    name = "sw-" + foundry.utils.randomID(8),
    scene = canvas.scene.id
  ) {
    const connectionTarget = (Stairway.connectionTarget = { scene, name });
    return connectionTarget;
  }

  static resetConnectionTarget() {
    Stairway.connectionTarget = null;
  }

  get name() {
    return this.document.name;
  }

  get icon() {
    return this.document.icon || STAIRWAY_DEFAULTS.icon;
  }

  get x() {
    return this.document.x;
  }

  get y() {
    return this.document.y;
  }

  get width() {
    return this.document.width || STAIRWAY_DEFAULTS.width;
  }

  get height() {
    return this.document.height || STAIRWAY_DEFAULTS.height;
  }

  get label() {
    // use partner scene name as label
    if (this.document.partnerSceneLabel) {
      return this.sceneLabel;
    }

    return typeof this.document.label === "string" ? this.document.label : "";
  }

  get sceneLabel() {
    const targetScene = this.targetScene;

    if (targetScene) {
      return targetScene.name;
    } else {
      return "";
    }
  }

  /* -------------------------------------------- */

  /**
   * Determine if stairway is on current scene
   * @return {boolean}
   */
  get onScene() {
    return (
      this.document.scene === null || this.document.scene === canvas.scene.id
    );
  }

  /* -------------------------------------------- */

  /**
   * Determine stairway status and icon tint
   * @return {Object}
   */
  get status() {
    const { targetScene, targetData } = this.target;
    let background = COLOR.onScene;
    let border = 0x000000;
    let name = "connected";

    if (!this.onScene) {
      background = COLOR.onTargetScene;
    }

    // on other scene
    if (targetScene) {
      if (!targetData) {
        // missing partner on target scene
        name = "no-partner-other-scene";
        border = COLOR.noPartnerOtherScene;
      }
    } else if (!this.otherPlaceable) {
      // missing partner on this scene
      name = "no-partner";
      border = COLOR.noPartner;
    }

    if (this.nonMonogamous) {
      // has more than one partner
      name = "non-monogamous";
      border = COLOR.nonMonogamous;
    }

    // status color for configuration sheet
    const config = `#${(border !== 0x000000 ? border : background).toString(
      16
    )}`;

    // Map status name to localization key
    const statusKeys = {
      "connected": "STAIRWAYS.StatusConnected",
      "no-partner": "STAIRWAYS.StatusNoPartner",
      "no-partner-other-scene": "STAIRWAYS.StatusNoPartnerOtherScene",
      "non-monogamous": "STAIRWAYS.StatusNonMonogamous",
    };

    return {
      name: statusKeys[name] || `STAIRWAYS.Status${name}`,
      color: { background, border, config },
    };
  }

  /**
   * Determine stairway render state
   * @return {String}
   */
  get renderState() {
    // determine render state
    let renderState;
    if (this._original && this._original.otherPlaceable) {
      // we are a clone for an ongoing move action
      renderState = "move";
    } else if (this.otherPlaceable) {
      if (this.master) {
        renderState = "master";
      } else {
        renderState = "slave";
      }
    } else {
      // no partner no line
      renderState = null;
    }

    return renderState;
  }

  /**
   * Find stairway target scene
   * @return {Object}
   */
  get targetScene() {
    if (this.onScene) {
      return null;
    } else {
      // find target scene
      return game.scenes.get(this.document.scene);
    }
  }

  /**
   * Find stairway target scene and target
   * @return {Object}
   */
  get target() {
    // stairway has partner on this scene
    if (this.otherPlaceable) {
      return { targetScene: null, targetData: this.otherPlaceable.document };
    }

    // stairway has a target scene
    const targetScene = this.targetScene;
    if (targetScene) {
      // find stairway with matching name
      const others = (
        targetScene.flags?.pirateborg?.stairways ?? []
      ).filter((other) => this.name === other.name);

      if (others.length === 1) {
        // stairway has target scene and partner
        this.nonMonogamous = false;
        return { targetScene, targetData: others[0] };
      } else if (others.length > 1) {
        // sanity check failed
        this.nonMonogamous = true;
        console.warn("This stairway is in a non-monogamous relationship!");
        console.log(this, others);
      }

      // stairway has target scene but partner wasn't found
      return { targetScene, targetData: null };
    }

    // stairway is missing partner and target scene (either stairway is on this scene or scene missing)
    return { targetScene: null, targetData: null };
  }

  /**
   * Is this the connection target for a new stairway
   * @return {boolean}
   */
  get isConnectionTarget() {
    if (Stairway.connectionTarget) {
      const { scene, name } = Stairway.connectionTarget;
      return scene === canvas.scene.id && name === this.name;
    }

    return false;
  }

  /**
   * Define a PIXI TextStyle object which is used for the label text
   * @returns {PIXI.TextStyle}
   */
  get labelTextStyle() {
    const style = CONFIG.canvasTextStyle.clone();

    // alignment
    style.align = "center";

    // font preferences
    style.fontFamily = this.document.fontFamily || STAIRWAY_DEFAULTS.fontFamily;
    style.fontSize = this.document.fontSize || STAIRWAY_DEFAULTS.fontSize;

    // toggle stroke style depending on whether the text color is dark or light
    const color = this.document.textColor
      ? this.document.textColor
      : new foundry.utils.Color(0xffffff);
    const hsv = color.hsv;
    style.fill = color;
    style.strokeThickness = Math.max(Math.round(style.fontSize / 12), 2);
    style.stroke = hsv[2] > 0.6 ? 0x111111 : 0xeeeeee;

    // drop shadow
    style.dropShadow = true;
    style.dropShadowColor = style.stroke;
    style.dropShadowBlur = Math.max(Math.round(style.fontSize / 6), 4);
    style.dropShadowAngle = 0;
    style.dropShadowDistance = 0;

    return style;
  }

  /* -------------------------------------------- */

  /** @override */
  get bounds() {
    const bounds = new PIXI.Rectangle(this.x, this.y, 1, 1);
    return bounds.normalize();
  }

  /* -------------------------------------------- */
  /* Rendering
  /* -------------------------------------------- */

  /** @override */
  clear() {
    if (this.controlIcon) {
      this.controlIcon.parent.removeChild(this.controlIcon).destroy();
      this.controlIcon = null;
    }
    super.clear();
  }

  /** @override */
  async _draw() {
    // create containers
    this.line = this.addChild(new PIXI.Graphics());
    this.controlIcon = this.addChild(
      new StairwayControlIcon({
        sceneLabel: this.sceneLabel,
        sceneLabelTextStyle: this.sceneLabelTextStyle,
        label: this.label,
        textStyle: this.labelTextStyle,
        texture: this.icon,
        width: this.width,
        height: this.height,
      })
    );
    this.lockIcon = this.addChild(new PIXI.Sprite());
    this.lockIcon.texture = await foundry.canvas.loadTexture(
      "icons/svg/padlock.svg"
    );

    // Initial rendering
    this.refresh();
    if (this.id) this.activateListeners();
    return this;
  }

  /* -------------------------------------------- */

  /** @override */
  refresh(options) {
    super.refresh();

    // update state
    this.position.set(this.x, this.y);
    this.updateOtherPlaceable();
    this.updateConnectionTarget();
    this.updateMaster();

    // clear old line
    this.line.clear();

    // draw line when master or during move
    const renderState = this.renderState;
    if (renderState === "master" || renderState === "move") {
      // clear slave line
      if (renderState === "master") {
        this.otherPlaceable.line.clear();
      }

      // draw connection line using PIXI v7 API
      this.line.clear();
      this.line.lineStyle(3, this.document.animate ? 0xccccff : 0x9fe2bf);
      this.line.moveTo(0, 0);
      this.line.lineTo(
        this.otherPlaceable.document.x - this.document.x,
        this.otherPlaceable.document.y - this.document.y
      );

      // set other stairway in front of us (and therefore the line)
      this.zIndex = -1;
      this.otherPlaceable.zIndex = 1;
    } else if (renderState === "slave") {
      // trigger master update
      this.otherPlaceable.refresh();
    }

    // update icon tint
    const { background, border } = this.status.color;
    this.controlIcon.tint = this.document.disabled === true ? 0x999999 : 0x000000;
    this.controlIcon.typeColor = background;
    this.controlIcon.statusColor = border;
    this.controlIcon.draw();

    // lock icon
    this.lockIcon.width = this.lockIcon.height = this.controlIcon.iconSize * 0.5;

    // Update visibility
    this.alpha = this.document.hidden === true ? 0.5 : 1.0;
    this.lockIcon.visible = this.document.disabled === true;
    this.controlIcon.border.visible = this.hover || this.isConnectionTarget;

    return this;
  }

  /* -------------------------------------------- */

  updateOtherPlaceable() {
    // partner on other scene
    if (this.otherPlaceable || !this.onScene) {
      return;
    }

    if (this.otherPlaceable === false) {
      // partner is being deleted, skip search
      this.otherPlaceable = null;
    } else if (!this._original) {
      // find partner in same scene, ignore move clones
      const others = canvas.stairways.placeables.filter(
        (other) =>
          other.onScene &&
          !other._original &&
          this.name === other.name &&
          this.id !== other.id
      );

      if (others.length === 1) {
        // found partner
        const otherPlaceable = others[0];
        this.nonMonogamous = false;

        // link stairways
        this.otherPlaceable = otherPlaceable;
        otherPlaceable.otherPlaceable = this;

        // update other
        // needed to remove isTarget highlight
        otherPlaceable.refresh();
      } else if (others.length > 1) {
        // sanity check failed
        this.nonMonogamous = true;
        console.warn("This stairway is in a non-monogamous relationship!");
        console.log(this, others);
      }
    } else if (this._original.otherPlaceable) {
      // use original other
      this.otherPlaceable = this._original.otherPlaceable;
    }
  }

  /* -------------------------------------------- */

  resetOtherPlaceable() {
    // unset this from other, update other
    if (this.otherPlaceable) {
      this.otherPlaceable.otherPlaceable = false;
      this.otherPlaceable.refresh();
      this.otherPlaceable = null;
    }
  }

  /* -------------------------------------------- */

  updateMaster() {
    if (this.otherPlaceable) {
      // be master when highlighted or when master is unclaimed
      if (this.hover || !this.otherPlaceable.master) {
        this.master = true;
        this.otherPlaceable.master = false;
      }
    }
  }

  /* -------------------------------------------- */

  updateConnectionTarget() {
    if (this.isConnectionTarget) {
      // if we already have a partner or the partner is on another scene
      if (this.otherPlaceable || this.nonMonogamous || !this.onScene) {
        // then clear connection target
        // this can happen when stairway is edited manually
        Stairway.resetConnectionTarget();
      }
    } else if (
      !this.otherPlaceable &&
      this.onScene &&
      !this.nonMonogamous &&
      !Stairway.connectionTarget
    ) {
      // there is no connection target and we no longer have a partner
      // make ourself the new connection target
      Stairway.setConnectionTarget(this.name);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  _destroy(...args) {
    if (this.stairwayControl) this.stairwayControl.destroy({ children: true });
    super._destroy(...args);
  }

  /* -------------------------------------------- */
  /*  Socket Listeners and Handlers               */
  /* -------------------------------------------- */

  /** @override */
  _onCreate(...args) {
    super._onCreate(...args);
    canvas.controls.createStairwayControl(this);

    const { targetScene, targetData } = this.target;
    if (targetData) {
      // sync partner animate option
      const data = { animate: this.document.animate };

      // if partner is on another scene, update partner with our scene id
      if (targetScene) {
        data.scene = canvas.scene.id;
      }

      (targetScene || canvas.scene).updateEmbeddedDocuments(
        this.document.documentName,
        [{ _id: targetData._id, ...data }]
      );
    }

    // update sight when new stairway was added
    canvas.perception.update({ refreshVision: true }, true);
  }

  /* -------------------------------------------- */

  /** @override */
  _onUpdate(data, ...args) {
    super._onUpdate(data, ...args);

    // update partner animate option
    if (game.user.isGM) {
      const { targetScene, targetData } = this.target;
      if (targetData) {
        const scene = targetScene ?? canvas.scene;

        if (targetData.animate !== data.animate) {
          scene.updateEmbeddedDocuments(this.document.documentName, [
            { _id: targetData._id, animate: data.animate },
          ]);
        }
      }
    }

    // refresh drawables / other connection
    this.resetOtherPlaceable();
    this.draw();
    if (this.stairwayControl) this.stairwayControl.draw();

    // update sight when stairway was updated
    canvas.perception.update({ refreshVision: true }, true);
  }

  /** @override */
  _onDelete(...args) {
    // unset stairway connection target
    if (this.isConnectionTarget) {
      Stairway.resetConnectionTarget();
    }

    this.resetOtherPlaceable();
    super._onDelete(...args);
  }

  /* -------------------------------------------- */

  /** @override */
  _canHUD(user, event) {
    return true;
  }

  /* -------------------------------------------- */

  /** @override */
  async _onClickRight(event) {
    const { targetScene, targetData } = this.target;

    // view target scene
    if (targetScene) {
      await targetScene.view();
    }

    // pan to target stairway
    if (targetData) {
      canvas.animatePan({ x: targetData.x, y: targetData.y });
    }
  }
}
