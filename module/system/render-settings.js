import { showHelpDialog } from "../dialog/help-dialog.js";

export const renderSettings = (app, html) => {
  const button = document.createElement("button");
  button.innerText = "PIRATE BORG";

  const settings = html[0].querySelector("#settings-documentation");
  settings.insertBefore(button, settings.firstChild);

  button.addEventListener("click", () => {
    showHelpDialog();
  });
};
