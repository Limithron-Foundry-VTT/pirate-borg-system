import { diceSound } from "../dice.js";
import { getMessageContent, getMessageSpeaker, getSystemFlag, setSystemFlag } from "../utils.js";

export const OUTCOME_BUTTON = {
  ANCIENT_RELIC: "button-ancient-relic",
  MYSTICAL_MISHAP: "button-mystical-mishap",
  REPAIR_CREW_ACTION: "button-repair-crew-action",
  TAKE_DAMAGE: "button-take-damage",
  INFLICT_DAMAGE: "button-inflict-damage",
};

export class OutcomeChatButton {
  static buttons = [];
  static TEMPLATE = "systems/pirateborg/templates/chat/generic-button-outcome.html";

  /**
   * @param {String} type
   * @param {function(*)} execute
   */
  static register({ type, execute }) {
    const alreadyRegistered = OutcomeChatButton.buttons.find((automation) => automation.type === type);
    if (!alreadyRegistered) {
      OutcomeChatButton.buttons.push({ type, execute });
    }
  }

  /**
   * @param {ChatMessage} message
   * @param {HTMLButtonElement} htmlButton
   * @return {Promise<void>}
   */
  static async handleChatMessage(message, htmlButton) {
    const actor = ChatMessage.getSpeakerActor(getMessageSpeaker(message));
    if (!actor) {
      return;
    }

    const outcomes = getSystemFlag(message, CONFIG.PB.flags.OUTCOMES) ?? [];
    const outcome = outcomes.find((outcome) => outcome.id === htmlButton.dataset.outcome);
    const button = OutcomeChatButton.buttons.find((button) => outcome.button?.data.type === button.type);
    const actionOutcomes = await button.execute(outcome);

    await OutcomeChatButton.updateMessageCard(message, outcome, actionOutcomes);

    await setSystemFlag(message, CONFIG.PB.flags.OUTCOMES, [...outcomes, ...actionOutcomes]);
  }

  /**
   * @param {ChatMessage} message
   * @param {Object} outcome
   * @param {Object[]} outcomes
   * @return {Promise<void>}
   */
  static async updateMessageCard(message, outcome, outcomes) {
    const messageContent = $(getMessageContent(message));
    const content = await renderTemplate(OutcomeChatButton.TEMPLATE, { outcomes });

    messageContent.find(`[data-outcome='${outcome.id}']`).remove();

    await message.update({
      content: messageContent.append($(content)).prop("outerHTML"),
      sound: diceSound(),
    });
  }
}
