import { getSystemFlag } from "../../api/utils.js";
import { OUTCOME_TEST } from "../../api/outcome/outcome.js";

/**
 * Apply crit/fumble CSS hooks to rendered chat outcomes.
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
export const decorateCritFumbleOutcomes = (message, html) => {
  if (!html?.querySelectorAll) return;

  const outcomes = getSystemFlag(message, CONFIG.PB.flags.OUTCOMES) ?? [];
  if (!Array.isArray(outcomes) || !outcomes.length) return;

  const outcomeById = new Map();
  const indexOutcome = (outcome) => {
    if (!outcome || !outcome.id) return;
    outcomeById.set(outcome.id, outcome);
    if (outcome.secondaryOutcome) indexOutcome(outcome.secondaryOutcome);
  };
  outcomes.forEach(indexOutcome);

  for (const tray of html.querySelectorAll("[data-outcome-id]")) {
    const outcomeId = tray.dataset?.outcomeId;
    if (!outcomeId) continue;
    const outcome = outcomeById.get(outcomeId);
    if (!outcome?.result) continue;

    const rollNode = tray.querySelector(".roll-result");
    if (!rollNode) continue;

    rollNode.classList.remove("pb-roll-critical-success", "pb-roll-fumble");
    if (outcome.result === OUTCOME_TEST.CRITICAL_SUCCESS) {
      rollNode.classList.add("pb-roll-critical-success");
    } else if (outcome.result === OUTCOME_TEST.FUMBLE) {
      rollNode.classList.add("pb-roll-fumble");
    }
  }
};
