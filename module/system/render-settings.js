import { showHelpDialog } from "../dialog/help-dialog.js";

/**
 * @param {Application} app
 * @param {jQuery} html
 */
export const renderSettings = (app, html) => {
  const button = document.createElement("button");
  button.innerText = game.i18n.localize("PB.PirateBorg");

  const settings = html[0].querySelector("#settings-documentation");
  settings.insertBefore(button, settings.firstChild);

  button.addEventListener("click", showHelpDialog);
};
