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
    const outcomeId = htmlButton.dataset.outcomeId ?? htmlButton.dataset.outcome;
    if (!outcomeId) return;

    const outcome = outcomes.find((entry) => entry.id === outcomeId);
    if (!outcome?.button?.data?.type) return;

    const button = OutcomeChatButton.buttons.find((entry) => outcome.button?.data.type === entry.type);
    if (!button?.execute) return;

    const actionOutcomes = await button.execute(outcome);
    if (!Array.isArray(actionOutcomes)) return;

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
    let content;
    if (game.release.generation >= 13) {
      content = await foundry.applications.handlebars.renderTemplate(OutcomeChatButton.TEMPLATE, { outcomes });
    } else {
      content = await renderTemplate(OutcomeChatButton.TEMPLATE, { outcomes });
    }

    // Remove the entire outcome tray row by canonical identity attribute.
    messageContent.find(`[data-outcome-id='${outcome.id}']`).closest("outcome-tray").remove();
    // Legacy fallback: old cards may only have data-outcome on the button.
    messageContent.find(`[data-outcome='${outcome.id}']`).remove();

    await message.update({
      content: messageContent.append($(content)).prop("outerHTML"),
      sound: diceSound(),
    });
  }
}
