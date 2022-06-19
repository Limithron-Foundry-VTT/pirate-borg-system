import { getSystemFlag, setSystemFlag } from "../../utils.js";

export class OutcomeAutomation {
  static automations = [];

  static register({ filter, execute }) {
    OutcomeAutomation.automations.push({ filter, execute });
  }

  static async execute(outcome) {
    if (outcome.automationDone === true) {
      return false;
    }

    console.log("OutcomeAutomation::execute 1 ", outcome);

    outcome.automationDone = true;
    const automationCandidates = OutcomeAutomation.automations.filter((automation) => automation.filter(outcome));
    for (const automationCandidate of automationCandidates) {
      console.log("OutcomeAutomation::execute 2", outcome, automationCandidate.execute);
      await automationCandidate.execute(outcome);
    }
    return true;
  }

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
