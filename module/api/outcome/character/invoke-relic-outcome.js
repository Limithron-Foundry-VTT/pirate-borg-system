import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { outcome, withAutomations, withButton, withTarget } from "../outcome.js";
import { OUTCOME_BUTTON } from "../../automation/outcome-chat-button.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createInvokeRelicOutcome = async ({ actor }) =>
  asyncPipe(
    outcome({ type: "invoke-relic" }),
    withTarget({ actor }),
    withButton({
      title: game.i18n.localize("PB.TestRelic"), 
      type: OUTCOME_BUTTON.ANCIENT_RELIC
    }),
    withAutomations(ADVANCED_ANIMATION_TYPE.INVOKE_RELIC)
  )();
