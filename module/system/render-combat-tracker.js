import { actorPartyInitiativeAction } from "../api/action/actor/actor-party-initiative-action.js";

/**
 * @param {CombatTracker} tracker
 * @param {JQuery.<HTMLElement>} html
 */
export const renderCombatTracker = (tracker, html) => {
  html
    .find("header")
    .find("nav")
    .last()
    .prepend(`<a class="combat-control" title="${game.i18n.localize("PB.RollPartyInitiative")}" data-control="rollParty"><i class="fas fa-dice-six"></i></a>`);
  html.find("a[data-control=rollParty]").on("click", actorPartyInitiativeAction);
};
