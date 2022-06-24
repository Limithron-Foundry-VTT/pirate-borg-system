import { AllowedCharacterClassesDialog } from "../dialog/allowed-character-classes-dialog.js";

export const registerSystemSettings = () => {
  /** Track the system version upon which point a migration was last applied. */
  game.settings.register("pirateborg", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  /** Track the last help dialog */
  game.settings.register("pirateborg", "systemHelpDialogVersion", {
    name: "System Help Dialog Version",
    scope: "client",
    config: false,
    type: String,
    default: "",
  });

  /** Whether to keep track of carrying capacity */
  game.settings.register("pirateborg", "trackCarryingCapacity", {
    name: "PB.SettingsApplyOvercapacityPenalty",
    hint: "PB.SettingsApplyOvercapacityPenaltyHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /** Whether to keep track of ranged weapon ammo */
  game.settings.register("pirateborg", "trackAmmo", {
    name: "PB.SettingsTrackAmmo",
    hint: "PB.SettingsTrackAmmoHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /** Whether to allow target selection on attack/defense/crew action dialog */
  game.settings.register("pirateborg", "targetSelection", {
    name: "PB.SettingsTargetSelection",
    hint: "PB.SettingsTargetSelectionHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /** Whether to enforce target selection when attacking */
  game.settings.register("pirateborg", "enforceTarget", {
    name: "PB.SettingsEnforceTarget",
    hint: "PB.SettingsEnforceTargetHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /** Whether to apply automatically damage on self or target */
  game.settings.register("pirateborg", "automaticDamage", {
    name: "PB.SettingsAutomaticDamage",
    hint: "PB.SettingsAutomaticDamageHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /** Whether to show the hit and miss animation */
  game.settings.register("pirateborg", "outcomeAnimation", {
    name: "PB.SettingsOutcomeAnimation",
    hint: "PB.SettingsOutcomeAnimationHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /** Whether to show the hit and miss animation */
  game.settings.register("pirateborg", "advancedAnimation", {
    name: "PB.SettingsAdvancedAnimation",
    hint: "PB.SettingsAdvancedAnimationHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true,
  });

  /** The allowed classes menu */
  game.settings.registerMenu("pirateborg", "EditAllowedCharacterGeneratorClassesMenu", {
    name: "PB.EditAllowedCharacterGeneratorClassesMenu",
    hint: "PB.EditAllowedCharacterGeneratorClassesMenuHint",
    label: "PB.EditAllowedCharacterGeneratorClassesMenuButtonLabel",
    icon: "fas fa-cog",
    type: AllowedCharacterClassesDialog,
    restricted: true,
  });

  /** The allowed classes for Character Generator */
  game.settings.register("pirateborg", "allowedCharacterGeneratorClasses", {
    name: "",
    default: {},
    type: Object,
    scope: "world",
    config: false,
  });

  /** The client Character Generator selected classes  */
  game.settings.register("pirateborg", "lastCharacterGeneratorSelection", {
    name: "",
    default: [],
    type: Array,
    scope: "client",
    config: false,
  });
};

/**
 * @returns {Boolean}
 */
export const trackCarryingCapacity = () => game.settings.get("pirateborg", "trackCarryingCapacity");

/**
 * @returns {Boolean}
 */
export const trackAmmo = () => game.settings.get("pirateborg", "trackAmmo");

/**
 * @param {String} classPack
 * @returns {Boolean}
 */
export const isCharacterGeneratorClassAllowed = (classPack) => {
  const allowedCharacterGeneratorClasses = game.settings.get("pirateborg", "allowedCharacterGeneratorClasses");
  return typeof allowedCharacterGeneratorClasses[classPack] === "undefined" ? true : !!allowedCharacterGeneratorClasses[classPack];
};

/**
 * @param {Object} allowedCharacterGeneratorClasses
 */
export const setAllowedCharacterGeneratorClasses = async (allowedCharacterGeneratorClasses) => {
  await game.settings.set("pirateborg", "allowedCharacterGeneratorClasses", allowedCharacterGeneratorClasses);
};

/**
 * @returns {Array.<String>}
 */
export const getLastCharacterGeneratorSelection = () => game.settings.get("pirateborg", "lastCharacterGeneratorSelection");

/**
 * @param {Array.<String>} lastCharacterGeneratorSelection
 */
export const setLastCharacterGeneratorSelection = async (lastCharacterGeneratorSelection) => {
  await game.settings.set("pirateborg", "lastCharacterGeneratorSelection", lastCharacterGeneratorSelection);
};

/**
 * @returns {String}
 */
export const getSystemMigrationVersion = () => game.settings.get("pirateborg", "systemMigrationVersion");

/**
 * @returns {String}
 */
export const setSystemMigrationVersion = async (systemMigrationVersion) =>
  await game.settings.set("pirateborg", "systemMigrationVersion", systemMigrationVersion);

/**
 * @returns {String}
 */
export const getSystemHelpDialogVersion = () => game.settings.get("pirateborg", "systemHelpDialogVersion");

/**
 * @returns {String}
 */
export const setSystemHelpDialogVersion = async (systemHelpDialogVersion) =>
  await game.settings.set("pirateborg", "systemHelpDialogVersion", systemHelpDialogVersion);

/**
 * @returns {Boolean}
 */
export const isAutomaticDamageEnabled = () => game.settings.get("pirateborg", "automaticDamage");

/**
 * @returns {Boolean}
 */
export const isOutcomeAnimationEnabled = () => game.settings.get("pirateborg", "outcomeAnimation");

/**
 * @returns {Boolean}
 */
export const isAdvancedAnimationEnabled = () => game.settings.get("pirateborg", "advancedAnimation");

/**
 * @returns {Boolean}
 */
export const isEnforceTargetEnabled = () => game.settings.get("pirateborg", "enforceTarget");

/**
 * @returns {Boolean}
 */
export const targetSelectionEnabled = () => game.settings.get("pirateborg", "targetSelection");
