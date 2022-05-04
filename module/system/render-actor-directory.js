import ScvmDialog from "../scvm/scvm-dialog.js";

export const renderActorDirectory = (app, html) => {
  if (game.user.can("ACTOR_CREATE")) {
    // only show the Create Scvm button to users who can create actors
    const section = document.createElement("header");
    section.classList.add("scvmfactory");
    section.classList.add("directory-header");
    // Add menu before directory header
    const dirHeader = html[0].querySelector(".directory-header");
    dirHeader.parentNode.insertBefore(section, dirHeader);
    section.insertAdjacentHTML(
      "afterbegin",
      `
      <div class="header-actions action-buttons flexrow">
        <button class="create-scvm-button"><i class="fas fa-skull"></i>Create Scvm</button>
      </div>
      `
    );
    section.querySelector(".create-scvm-button").addEventListener("click", () => {
      new ScvmDialog().render(true);
    });
  }
};
