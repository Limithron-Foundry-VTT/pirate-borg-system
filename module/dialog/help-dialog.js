import { getSystemHelpDialogVersion, setSystemHelpDialogVersion } from "../system/settings.js";
import { getModuleDependencies, getSystemVersion } from "../api/utils.js";
const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

export class HelpDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "help-dialog",
    classes: ["pirateborg", "sheet"],
    window: { title: "PB.PirateBorg" },
    position: { width: 600, height: 690 },
    actions: {
      enablePremium: HelpDialog.#onEnablePremium,
    },
  };

  static PARTS = {
    main: {
      template: "systems/pirateborg/templates/dialog/help-dialog.html",
      scrollable: [".tab"],
    },
  };

  static TABS = {
    sheet: {
      tabs: [
        { id: "about", group: "sheet", label: "PB.About" },
        { id: "help", group: "sheet", label: "PB.Help" },
        { id: "modules", group: "sheet", label: "PB.Modules" },
      ],
      initial: "about",
      labelAttr: "label",
    },
  };

  async _prepareContext() {
    return {
      tabs: this._prepareTabs("sheet"),
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
      .filter((module) => {
        if (module.type !== type) return false;
        if (module.compatibility?.max && game.release.generation > module.compatibility.max) return false;
        return true;
      })
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

  static #onEnablePremium() {
    new ModuleManagement().render({ force: true });
  }
}

export const showHelpDialogOnStartup = () => {
  const latestVersion = getSystemHelpDialogVersion();
  const currentVersion = getSystemVersion();
  if (latestVersion === null || foundry.utils.isNewerVersion(currentVersion, latestVersion)) {
    setSystemHelpDialogVersion(currentVersion);
    showHelpDialog();
  }
};

export const showHelpDialog = () => {
  new HelpDialog().render({ force: true });
};
