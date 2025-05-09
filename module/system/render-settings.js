import { showHelpDialog } from "../dialog/help-dialog.js";

/**
 * @param {Application} app
 * @param {HTMLElement|jQuery} html
 */
export const renderSettings = (app, html) => {
  html = html instanceof HTMLElement ? html : html[0];

  const icon = document.createElement("i");
  icon.classList.add("fas", "fa-skull");

  const button = document.createElement("button");
  button.innerText = game.i18n.localize("PB.PirateBorg");
  button.prepend(icon);
  button.addEventListener("click", showHelpDialog);

  let settings = html.querySelector("section.documentation");
  if (settings) {
    settings.insertBefore(button, settings.querySelector(".divider").nextSibling);
  } else {
    // Prior to Foundry v13
    settings = html.querySelector("#settings-documentation");
    settings.insertBefore(button, settings.firstChild);
  }
};
