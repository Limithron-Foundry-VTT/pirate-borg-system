import { showGenericCard } from "../../../chat-message/generic-card.js";
import { emitPartyInitiative } from "../../../system/sockets.js";
import { createPartyInitiativeOutcome } from "../../outcome/actor/party-initiative-outcome.js";

/**
 * @param {Combat} [combat=game.combat]
 * @param {Object} [options] - Passed to PBCombat#setPartyInitiative when the roller is a GM.
 * @returns {Promise<Object>}
 */
export const actorPartyInitiativeAction = async (combat = game.combat, options = {}) => {
  const outcome = await createPartyInitiativeOutcome();

  await showGenericCard({
    title: game.i18n.localize("PB.PartyInitiative"),
    outcomes: [outcome],
  });

  if (combat) {
    if (game.user.isGM) {
      await combat.setPartyInitiative(outcome.roll.total, options);
    } else if (game.users.activeGM) {
      emitPartyInitiative({ combatId: combat.id, rollTotal: outcome.roll.total, processorId: game.users.activeGM.id });
    } else {
      ui.notifications.warn(game.i18n.localize("PB.PartyInitiativeNoGM"));
    }
  }

  return outcome;
};
