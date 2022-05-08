import { AllowedScvmClassesDialog } from "./settings/allowed-scvm-classes-dialog.js";

export const registerSystemSettings = () => {
  /**
   * Track the system version upon which point a migration was last applied.
   */
  game.settings.register("pirateborg", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: String,
    default: "",
  });

  /**
   * Track the last help dialog
   */
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

  /** The allowed classes menu */
  game.settings.registerMenu("pirateborg", "EditAllowedScvmClassesMenu", {
    name: "PB.EditAllowedScvmClassesMenu",
    hint: "PB.EditAllowedScvmClassesMenuHint",
    label: "PB.EditAllowedScvmClassesMenuButtonLabel",
    icon: "fas fa-cog",
    type: AllowedScvmClassesDialog,
    restricted: true,
  });

  /** The allowed classes menu for scvmfactory */
  game.settings.register("pirateborg", "allowedScvmClasses", {
    name: "",
    default: {},
    type: Object,
    scope: "world",
    config: false,
  });

  /** The client scvmfactory selected classes  */
  game.settings.register("pirateborg", "lastScvmfactorySelection", {
    name: "",
    default: [],
    type: Array,
    scope: "client",
    config: false,
  });
};

export const trackCarryingCapacity = () => {
  return game.settings.get("pirateborg", "trackCarryingCapacity");
};

export const trackAmmo = () => {
  return game.settings.get("pirateborg", "trackAmmo");
};

export const isScvmClassAllowed = (classPack) => {
  const allowedScvmClasses = game.settings.get("pirateborg", "allowedScvmClasses");
  return typeof allowedScvmClasses[classPack] === "undefined" ? true : !!allowedScvmClasses[classPack];
};

export const setAllowedScvmClasses = (allowedScvmClasses) => {
  return game.settings.set("pirateborg", "allowedScvmClasses", allowedScvmClasses);
};

export const getLastScvmfactorySelection = () => {
  return game.settings.get("pirateborg", "lastScvmfactorySelection");
};

export const setLastScvmfactorySelection = (lastScvmfactorySelection) => {
  return game.settings.set("pirateborg", "lastScvmfactorySelection", lastScvmfactorySelection);
};

export const getSystemMigrationVersion = () => {
  return game.settings.get("pirateborg", "systemMigrationVersion");
};

export const setSystemMigrationVersion = (systemMigrationVersion) => {
  return game.settings.set("pirateborg", "systemMigrationVersion", systemMigrationVersion);
};

export const getSystemHelpDialogVersion = () => {
  return game.settings.get("pirateborg", "systemHelpDialogVersion");
};

export const setSystemHelpDialogVersion = (systemHelpDialogVersion) => {
  return game.settings.set("pirateborg", "systemHelpDialogVersion", systemHelpDialogVersion);
};
