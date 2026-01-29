/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

const fields = foundry.data.fields;

/**
 * The data schema for a Stairway embedded document.
 * @extends DocumentData
 * @memberof data
 * @see BaseStairway
 *
 * @param {object} data                   Initial data used to construct the data object
 * @param {BaseStairway} [document]       The embedded document to which this data object belongs
 *
 * @property {string} _id                 The _id which uniquely identifies this BaseStairway embedded document
 * @property {number} [x=0]               The x-coordinate position of the origin of the stairway
 * @property {number} [y=0]               The y-coordinate position of the origin of the stairway
 * @property {string} [scene]             Target (partner) scene id or `null` if current scene
 * @property {string} [name]              Stairway name (id for connection)
 * @property {string} [label]             Stairway label
 * @property {string} [fontFamily]        Label font family
 * @property {number} [fontSize]          Label font size
 * @property {string} [textColor]         Label text color
 * @property {string} [icon]              Stairway icon (image path) or `null` for default
 * @property {number} [width]             Stairway icon width
 * @property {number} [height]            Stairway icon height
 * @property {boolean} [disabled]         Disabled (locked on `true`)
 * @property {boolean} [hidden]           Hide from players (hidden on `true`)
 * @property {boolean} [animate]          Animate movement within scene (animate on `true`)
 * @property {boolean} [partnerSceneLabel] Use the name of the partner scene as label
 */

/**
 * The Document definition for a Stairway.
 * Defines the DataSchema and common behaviors for a Stairway.
 * @extends abstract.Document
 * @mixes StairwayData
 * @memberof documents
 *
 * @param {StairwayData} data                 Initial data from which to construct the Stairway
 * @param {DocumentConstructionContext} context   Construction context options
 */
export class BaseStairway extends foundry.abstract.Document {
  /* -------------------------------------------- */
  /*  Model Configuration                         */
  /* -------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      _id: new fields.DocumentIdField(),
      scene: new fields.ForeignDocumentField(BaseStairway, {
        idOnly: true,
        required: false,
        nullable: true,
      }),
      name: new fields.StringField({ required: true, blank: false }),
      x: new fields.NumberField({ required: true, nullable: false, integer: true }),
      y: new fields.NumberField({ required: true, nullable: false, integer: true }),
      label: new fields.StringField(),
      fontFamily: new fields.StringField(),
      fontSize: new fields.NumberField({ integer: true, positive: true }),
      textColor: new fields.ColorField(),
      icon: new fields.FilePathField({ categories: ["IMAGE"] }),
      width: new fields.NumberField({ positive: true }),
      height: new fields.NumberField({ positive: true }),
      disabled: new fields.BooleanField(),
      hidden: new fields.BooleanField(),
      animate: new fields.BooleanField(),
      partnerSceneLabel: new fields.BooleanField(),
      flags: new fields.ObjectField({ required: false, default: {} }),
    };
  }
}

// Set metadata
BaseStairway.metadata = Object.freeze(
  foundry.utils.mergeObject(
    foundry.abstract.Document.metadata,
    {
      name: "Stairway",
      collection: "stairways",
      label: "DOCUMENT.Stairway",
      labelPlural: "DOCUMENT.Stairways",
    },
    { inplace: false }
  )
);
