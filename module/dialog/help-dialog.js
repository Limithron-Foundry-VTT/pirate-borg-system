import { getSystemHelpDialogVersion, setSystemHelpDialogVersion } from "../system/settings.js";
import { getModuleDependencies, getSystemVersion } from "../api/utils.js";

export class HelpDialog extends FormApplication {
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
      height: 690,
      scrollY: [".tab"],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "about",
        },
      ],
    });
  }

  /** @override */
  getData(options) {
    const data = super.getData(options);
    return {
      ...data,
      pbModuleInstalled: !!game.modules.get(CONFIG.PB.premiumModuleName),
      pbModuleEnabled: !!game.modules.get(CONFIG.PB.premiumModuleName)?.active,
      pbModuleName: CONFIG.PB.premiumModuleName,
      version: getSystemVersion(),
      isGM: game.user.isGM,
      modules: {
        highlyRecommended: this.getModulesData("highly_recommended"),
        mustHave: this.getModulesData("must_have"),
        recommended: this.getModulesData("recommended"),
      },
    };
  }

  getModulesData(type) {
    return CONFIG.PB.recommendedModules
      .filter((module) => module.type === type)
      .map((module) => ({
        ...module,
        installed: !!game.modules.get(module.package),
        active: !!game.modules.get(module.package)?.active,
        dependencies: getModuleDependencies(game.modules.get(module.package)).map((dependency) => ({
          name: dependency.id,
          installed: !!game.modules.get(dependency.id),
          active: !!game.modules.get(dependency.id)?.active,
        })),
      }));
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("#help-dialog-enable-premium").on("click", this._enablePremiumModule.bind(this));
  }

  _enablePremiumModule() {
    new ModuleManagement().render(true);
  }
}

export const showHelpDialogOnStartup = () => {
  const latestVersion = getSystemHelpDialogVersion();
  const currentVersion = getSystemVersion();

  if (latestVersion === null || isNewerVersion(currentVersion, latestVersion)) {
    setSystemHelpDialogVersion(currentVersion);
    showHelpDialog();
  }
};

export const showHelpDialog = () => {
  const helpDialog = new HelpDialog();
  helpDialog.render(true);
};
