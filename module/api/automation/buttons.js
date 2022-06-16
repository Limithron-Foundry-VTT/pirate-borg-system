import { updateGenericCardOutcomeButton } from "../../chat-message/update-generic-card-outcome-button.js";
import { getSystemFlag } from "../../utils.js";
import { chatInflictDamageButtonAction } from "../action/chat/chat-inflict-damage-button-action.js";
import { chatInvokeRelicButtonAction } from "../action/chat/chat-invoke-relic-button-action.js";
import { chatMysticalMyshapButtonAction } from "../action/chat/chat-mystical-mishap-button-action.js";
import { chatShipRepairButtonAction } from "../action/chat/chat-ship-repair-button-action.js";
import { chatTakeDamageButtonAction } from "../action/chat/chat-take-damage-button-action.js";
import { emitScrollChatToBottom } from "../../system/sockets.js";

export const OUTCOME_BUTTON = {
  ANCIENT_RELIC: "ancient-relic",
  MYSTICAL_MISHAP: "mystical-mishap",
  REPAIR_CREW_ACTION: "repair-crew-action",
  TAKE_DAMAGE: "take-damage",
  INFLICT_DAMAGE: "inflict-damage",
};

/**
 * @param {ChatMessage} message
 */
export const handleActionButton = async (message, button) => {
  const actor = ChatMessage.getSpeakerActor(message.data.speaker);

  if (!actor) {
    return;
  }

  const messageOutcomes = getSystemFlag(message, "outcomes");
  const outcome = messageOutcomes.find((outcome) => outcome.id === button.dataset.outcome);
  const outcomes = await dispatchButtonOutcome(button.dataset.action, outcome);

  await updateGenericCardOutcomeButton({ message, outcome, outcomes });

  const lastMessage = Array.from(ui.chat.collection).pop();
  if (lastMessage && lastMessage.id === message.id) {
    emitScrollChatToBottom();
    ui.chat.scrollBottom();
  }
};

/**
 * @param {Actor} actor
 * @param {Object} data
 * @returns {Promise<Array.<Object>>}
 */
const dispatchButtonOutcome = async (action, outcome) => {
  switch (action) {
    case OUTCOME_BUTTON.ANCIENT_RELIC:
      return await chatInvokeRelicButtonAction(outcome);
    case OUTCOME_BUTTON.MYSTICAL_MISHAP:
      return await chatMysticalMyshapButtonAction(outcome);
    case OUTCOME_BUTTON.REPAIR_CREW_ACTION:
      return await chatShipRepairButtonAction(outcome);
    case OUTCOME_BUTTON.TAKE_DAMAGE:
      return await chatTakeDamageButtonAction(outcome);
    case OUTCOME_BUTTON.INFLICT_DAMAGE:
      return await chatInflictDamageButtonAction(outcome);
  }
};

export const createButton = (title, action, outcome) => ({
  title,
  data: {
    action,
    id: randomID(),
    outcome: outcome.id,
  },
});

export const createInflictDamageButton = ({ outcome = {} }) => createButton(game.i18n.localize("PB.RollDamageButton"), OUTCOME_BUTTON.INFLICT_DAMAGE, outcome);

export const createTakeDamageButton = ({ outcome = {} }) => ({
  title: game.i18n.localize("PB.RollDamageButton"),
  data: {
    action: OUTCOME_BUTTON.TAKE_DAMAGE,
    id: randomID(),
    outcome: outcome.id,
  },
});

export const createRelicButton = ({ outcome = {} }) => ({
  title: game.i18n.localize("PB.TestRelic"),
  data: {
    action: OUTCOME_BUTTON.ANCIENT_RELIC,
    id: randomID(),
    outcome: outcome.id,
  },
});

export const createMysticalMishapButton = ({ outcome = {} }) => ({
  title: game.i18n.localize("PB.InvokableRitualFailureButton"),
  data: {
    action: OUTCOME_BUTTON.MYSTICAL_MISHAP,
    id: randomID(),
    outcome: outcome.id,
  },
});

export const createShipRepairButton = ({ outcome = {} }) => ({
  title: game.i18n.localize("PB.ShipRepairButton"),
  data: {
    action: OUTCOME_BUTTON.REPAIR_CREW_ACTION,
    id: randomID(),
    outcome: outcome.id,
  },
});
