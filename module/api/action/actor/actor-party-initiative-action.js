import { showGenericCard } from "../../../chat-message/generic-card.js";
import { emitPartyInitiative } from "../../../system/sockets.js";
import { createPartyInitiativeOutcome } from "../../outcome/actor/party-initiative-outcome.js";

/**
 * @returns {Promise<Object>}
 */
export const actorPartyInitiativeAction = async () => {
  const outcome = await createPartyInitiativeOutcome();

  await showGenericCard({
    title: game.i18n.localize("PB.PartyInitiative"),
    outcomes: [outcome],
  });

  if (game.combats && game.combat) {
    if (game.user.isGM) {
      await game.combat.setPartyInitiative(outcome.roll.total);
    } else if (game.users.activeGM) {
      emitPartyInitiative({ combatId: game.combat.id, rollTotal: outcome.roll.total, processorId: game.users.activeGM.id });
    } else {
      ui.notifications.warn(game.i18n.localize("PB.PartyInitiativeNoGM"));
    }
  }

  return outcome;
};
