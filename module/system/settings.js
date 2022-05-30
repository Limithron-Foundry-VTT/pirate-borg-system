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

  /** Whether to apply automatically damage on self or target */
  game.settings.register("pirateborg", "automaticDamage", {
    name: "PB.SettingsAutomaticDamage",
    hint: "PB.SettingsAutomaticDamageHint",
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
  
  /** Whether to show the hit and miss animation */
  game.settings.register("pirateborg", "attackAnimation", {
    name: "PB.SettingsAttackAnimation",
    hint: "PB.SettingsAttackAnimationHint",
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
export const trackCarryingCapacity = () => {
  return game.settings.get("pirateborg", "trackCarryingCapacity");
};

/**
 * @returns {Boolean}
 */
export const trackAmmo = () => {
  return game.settings.get("pirateborg", "trackAmmo");
};

/**
 * @param {String} classPack
 * @returns {Boolean}
 */
export const isCharacterGeneratorClassAllowed = (classPack) => {
  const allowedCharacterGeneratorClasses = game.settings.get("pirateborg", "allowedCharacterGeneratorClasses");
  return typeof allowedCharacterGeneratorClasses[classPack] === "undefined" ? true : !!allowedCharacterGeneratorClasses[classPack];
};

/**
 * @param {Array.<String>} allowedCharacterGeneratorClasses
 */
export const setAllowedCharacterGeneratorClasses = (allowedCharacterGeneratorClasses) => {
  game.settings.set("pirateborg", "allowedCharacterGeneratorClasses", allowedCharacterGeneratorClasses);
};

/**
 * @returns {Array.<String>}
 */
export const getLastCharacterGeneratorSelection = () => {
  return game.settings.get("pirateborg", "lastCharacterGeneratorSelection");
};

/**
 * @param {Array.<String>} lastCharacterGeneratorSelection
 */
export const setLastCharacterGeneratorSelection = (lastCharacterGeneratorSelection) => {
  game.settings.set("pirateborg", "lastCharacterGeneratorSelection", lastCharacterGeneratorSelection);
};

/**
 * @returns {String}
 */
export const getSystemMigrationVersion = () => {
  return game.settings.get("pirateborg", "systemMigrationVersion");
};

/**
 * @returns {String}
 */
export const setSystemMigrationVersion = (systemMigrationVersion) => {
  return game.settings.set("pirateborg", "systemMigrationVersion", systemMigrationVersion);
};

/**
 * @returns {String}
 */
export const getSystemHelpDialogVersion = () => {
  return game.settings.get("pirateborg", "systemHelpDialogVersion");
};

/**
 * @returns {String}
 */
export const setSystemHelpDialogVersion = (systemHelpDialogVersion) => {
  return game.settings.set("pirateborg", "systemHelpDialogVersion", systemHelpDialogVersion);
};

/**
 * @returns {Boolean}
 */
export const isAutomaticDamageEnabled = () => {
  return game.settings.get("pirateborg", "automaticDamage");
};

/**
 * @returns {Boolean}
 */
export const isAttackAnimationEnabled = () => {
  return game.settings.get("pirateborg", "attackAnimation");
};

/**
 * @returns {Boolean}
 */
 export const isEnforceTargetEnabled = () => {
  return game.settings.get("pirateborg", "enforceTarget");
};

/**
 * @returns {Boolean}
 */
export const targetSelectionEnabled = () => {
  return game.settings.get("pirateborg", "targetSelection");
};