import { rollPartyInitiative } from "./combat.js";

/**
 * @param {CombatTracker} tracker
 * @param {jQuery} html
 */
export const renderCombatTracker = (tracker, html) => {
  const partyInitiativeButton = `<a class="combat-control" title="${game.i18n.localize(
    "PB.RollPartyInitiative"
  )}" dataControl="rollParty"><i class="fas fa-dice-six"></i></a>`;
  html.find("header").find("nav").last().prepend(partyInitiativeButton);
  html.find("a[dataControl=rollParty]").click(() => {
    rollPartyInitiative();
  });
};
