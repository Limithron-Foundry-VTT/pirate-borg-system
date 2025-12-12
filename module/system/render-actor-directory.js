import { showCharacterGeneratorDialog } from "../dialog/character-generator-dialog.js";

/**
 * @param {Application} app
 * @param {HTMLElement|jQuery} html
 */
export const renderActorDirectory = (app, html) => {
  if (game.user.can("ACTOR_CREATE")) {
    html = html instanceof HTMLElement ? html : html[0];

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("create-character-generator-button");
    button.innerHTML = '<i class="fas fa-skull"></i>The Tavern';
    button.addEventListener("click", () => {
      showCharacterGeneratorDialog();
    });

    let headerActions = html.querySelector(".header-actions");
    // FIXME: Workaround for 336 bug. Remove when 337 released.
    if (!headerActions) {
      headerActions = document.createElement("div");
      headerActions.className = "header-actions action-buttons flexrow";
      html.querySelector(":scope > header").insertAdjacentElement("afterbegin", headerActions);
    }
    headerActions.prepend(button);
  }
};
