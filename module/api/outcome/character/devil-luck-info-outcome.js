import { asyncPipe } from "../../utils.js";
import { outcome, withButton, withTarget } from "../outcome.js";
import { OUTCOME_BUTTON } from "../../automation/outcome-chat-button.js";

export const createDevilLuckInfoOutcome = async ({ actor }) =>
  asyncPipe(
    outcome({
      type: "devil-luck-info",
    }),
    withTarget({ actor }),
    withButton({
      title: game.i18n.localize("PB.ConsumeLuckButton"),
      type: OUTCOME_BUTTON.CONSUME_LUCK,
    }),
  )();
