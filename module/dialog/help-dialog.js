import { getSystemHelpDialogVersion, setSystemHelpDialogVersion } from "../settings.js";

export default class HelpDialog extends Application {
  constructor(options = {}) {
    super(options);
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "help-dialog",
      classes: ["pirateborg", "sheet"],
      template: "systems/pirateborg/templates/dialog/help-dialog.html",
      title: game.i18n.localize("PB.PirateBorg"),
      width: 600,
      height: 560,
      scrollY: [".tab"],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "about",
        },
      ],
      dragDrop: [{ dropSelector: 'textarea[name="data.startingBonusItems"]' }, { dropSelector: 'textarea[name="data.startingBonusRolls"]' }],
    });
  }
}

export const showHelpDialogOnStartup = () => {
  const latestVersion = getSystemHelpDialogVersion();
  const currentVersion = game.system.data.version;

  if (latestVersion === null || isNewerVersion(currentVersion, latestVersion)) {
    setSystemHelpDialogVersion(currentVersion);
    showHelpDialog();
  }
};

export const showHelpDialog = () => {
  const helpDialog = new HelpDialog();
  helpDialog.render(true);
};
