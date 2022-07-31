import { getSystemFlag, setSystemFlag } from "../utils.js";

export class OutcomeAutomation {
  static automations = [];

  /**
   * @param {String} type
   * @param {function(Object)} execute
   */
  static register({ type, execute }) {
    const isRegistered = OutcomeAutomation.automations.some((automation) => automation.type === type);
    if (!isRegistered) {
      OutcomeAutomation.automations.push({ type, execute });
    }
  }

  /**
   * @param {Object} outcome
   * @return {Promise<boolean>}
   */
  static async execute(outcome) {
    if (outcome.automationDone === true) {
      return false;
    }
    outcome.automationDone = true;
    const automationCandidates = OutcomeAutomation.automations.filter((automation) => outcome.automations?.includes(automation.type));
    for (const automationCandidate of automationCandidates) {
      await automationCandidate.execute(outcome);
    }
    return true;
  }

  /**
   * @param {ChatMessage} message
   * @return {Promise<void>}
   */
  static async handleChatMessage(message) {
    const outcomes = getSystemFlag(message, CONFIG.PB.flags.OUTCOMES) ?? [];

    let hasChanges = false;
    for (const outcome of outcomes) {
      hasChanges = (await OutcomeAutomation.execute(outcome)) || hasChanges;
    }

    if (hasChanges) {
      await setSystemFlag(message, CONFIG.PB.flags.OUTCOMES, outcomes);
    }
  }
}
