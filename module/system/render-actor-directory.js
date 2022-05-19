import CharacterGeneratorDialog from "../dialog/character-generator-dialog.js";

export const renderActorDirectory = (app, html) => {
  if (game.user.can("ACTOR_CREATE")) {
    // only show the Create CharacterGenerator button to users who can create actors
    const section = document.createElement("header");
    section.classList.add("character-generator");
    section.classList.add("directory-header");
    // Add menu before directory header
    const dirHeader = html[0].querySelector(".directory-header");
    dirHeader.parentNode.insertBefore(section, dirHeader);
    section.insertAdjacentHTML(
      "afterbegin",
      `
      <div class="header-actions action-buttons flexrow">
        <button class="create-character-generator-button"><i class="fas fa-skull"></i>The Tavern</button>
      </div>
      `
    );
    section.querySelector(".create-character-generator-button").addEventListener("click", () => {
      new CharacterGeneratorDialog().render(true);
    });
  }
};
