/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

import { STAIRWAY_DEFAULTS, COLOR } from "./StairwayConfig.js";

const ICON_SIZE = 100;
const SCALE_BORDER = false;

/**
 * A helper for drawing a stairway Control Icon
 * @type {PIXI.Container}
 */
export class StairwayControlIcon extends PIXI.Container {
  /* -------------------------------------------- */

  constructor(
    {
      sceneLabel,
      sceneLabelTextStyle,
      label,
      textStyle,
      typeColor = 0x000000,
      statusColor = 0x000000,
      texture,
      width = 1,
      height = 1,
      borderColor = 0xff5500,
      tint = null,
    } = {},
    ...args
  ) {
    super(...args);

    // options
    this.sceneLabelText = sceneLabel;
    this._sceneLabelTextStyle = sceneLabelTextStyle;
    this.labelText = label;
    this.labelTextStyle = textStyle;
    this.typeColor = typeColor;
    this.statusColor = statusColor;
    this.borderColor = borderColor;
    this.iconSrc = texture;
    this.tintColor = tint;
    this.iconWidth = width || STAIRWAY_DEFAULTS.width;
    this.iconHeight = height || STAIRWAY_DEFAULTS.height;
    this.rect = this.borderSize;

    // add offset
    this.x -= this.width * 0.5;
    this.y -= this.height * 0.5;

    // interactive hit area
    this.eventMode = "static";
    this.interactiveChildren = false;
    this.hitArea = new PIXI.Rectangle(...this.borderSize);

    // create Background, Icon, Border
    this.bg = this.addChild(new PIXI.Graphics());
    this.icon = this.addChild(new PIXI.Sprite());
    this.border = this.addChild(new PIXI.Graphics());

    this.onmouseenter = this._onHoverIn;
    this.onmouseleave = this._onHoverOut;

    // draw asynchronously
    this.draw();
  }

  /* -------------------------------------------- */

  /** @override */
  async draw() {
    // load icon texture
    this.texture =
      this.texture ?? (await foundry.canvas.loadTexture(this.iconSrc));

    // don't draw when destroyed
    if (this.destroyed) return this;

    const scale = this.scale;

    // Draw background using PIXI v7 API
    this.bg.clear();
    this.bg.beginFill(this.typeColor || 0, 0.4);
    this.bg.lineStyle(2 * scale, this.statusColor || 0, 1.0);
    this.bg.drawRoundedRect(...this.rect, 5);
    this.bg.endFill();

    // Draw border using PIXI v7 API
    this.border.clear();
    this.border.lineStyle(2 * scale, this.borderColor, 1.0);
    this.border.drawRoundedRect(...this.rect, 5);
    this.border.endFill();
    this.border.visible = false;

    // Draw icon
    this.icon.texture = this.texture;
    this.icon.width = this.width;
    this.icon.height = this.height;
    this.icon.tint = Number.isNumeric(this.tintColor)
      ? this.tintColor
      : 0xffffff;

    // Draw scene label
    this.sceneLabel =
      this.sceneLabel ||
      this.addChild(
        new foundry.canvas.containers.PreciseText(
          this.sceneLabelText,
          this.sceneLabelTextStyle
        )
      );
    this.sceneLabel.anchor.set(0.5, 1);
    this.sceneLabel.position.set(...this.sceneLabelPosition);

    // Draw label
    this.label =
      this.label ||
      this.addChild(
        new foundry.canvas.containers.PreciseText(
          this.labelText,
          this.labelTextStyle
        )
      );
    this.label.anchor.set(0.5, 0);
    this.label.position.set(...this.labelPosition);

    return this;
  }

  /* -------------------------------------------- */

  static get canvasScale() {
    return (canvas.dimensions.size || 100) / 100;
  }

  /* -------------------------------------------- */

  get scale() {
    if (SCALE_BORDER) {
      return (
        ((this.iconWidth + this.iconHeight) /
          (STAIRWAY_DEFAULTS.width + STAIRWAY_DEFAULTS.height)) *
        StairwayControlIcon.canvasScale
      );
    } else {
      return StairwayControlIcon.canvasScale;
    }
  }

  /* -------------------------------------------- */

  get iconSize() {
    return Math.max(this.width, this.height);
  }

  /* -------------------------------------------- */

  get width() {
    return this.iconWidth * ICON_SIZE * StairwayControlIcon.canvasScale;
  }

  /* -------------------------------------------- */

  get height() {
    return this.iconHeight * ICON_SIZE * StairwayControlIcon.canvasScale;
  }

  /* -------------------------------------------- */

  get borderSize() {
    const scale = this.scale;
    return [
      -2 * scale,
      -2 * scale,
      this.width + 4 * scale,
      this.height + 4 * scale,
    ];
  }

  /* -------------------------------------------- */

  get labelPosition() {
    const borderSize = this.borderSize;
    return [borderSize[2] * 0.5, borderSize[3]];
  }

  /* -------------------------------------------- */

  get sceneLabelPosition() {
    const borderSize = this.borderSize;
    return [borderSize[2] * 0.5, borderSize[1]];
  }

  /* -------------------------------------------- */

  /**
   * Define a PIXI TextStyle object which is used for the label text
   * @returns {PIXI.TextStyle}
   */
  get sceneLabelTextStyle() {
    if (this._sceneLabelTextStyle) return this._sceneLabelTextStyle;

    const style = CONFIG.canvasTextStyle.clone();

    // alignment
    style.align = "center";

    // font preferences
    style.fontFamily = STAIRWAY_DEFAULTS.fontFamily;
    style.fontSize = STAIRWAY_DEFAULTS.fontSize;

    // toggle stroke style depending on whether the text color is dark or light
    const color = new foundry.utils.Color(COLOR.onTargetScene);
    style.fill = color;
    style.strokeThickness = 1;
    style.stroke = 0xcccccc;

    // drop shadow
    style.dropShadow = true;
    style.dropShadowColor = style.stroke;
    style.dropShadowBlur = 2;
    style.dropShadowAngle = 0;
    style.dropShadowDistance = 0;

    return style;
  }

  /* -------------------------------------------- */

  _onHoverIn(event) {
    this.border.visible = true;
  }

  _onHoverOut(event) {
    this.border.visible = false;
  }

  /**
   * Refresh the control icon
   */
  refresh() {
    return this.draw();
  }
}
