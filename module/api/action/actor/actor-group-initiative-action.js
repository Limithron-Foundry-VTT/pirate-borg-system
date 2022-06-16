import { showGenericCard } from "../../../chat-message/generic-card.js";

/**
 * @returns {Promise.<void>}
 */
export const actorPartyInitiativeAction = async () => {
  const outcome = await createPartyInitiativeOutcome();

  await showGenericCard({
    title: game.i18n.localize("PB.PartyInitiative"),
    outcomes: [outcome],
  });

  if (game.combats && game.combat) {
    await game.combat.setPartyInitiative(outcome.roll.total);
  }
};
