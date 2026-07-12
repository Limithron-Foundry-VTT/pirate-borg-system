import { showGenericCard } from "../../../chat-message/generic-card.js";
import { asyncPipe } from "../../utils.js";
import { drawJokerTable } from "../../compendium.js";
import { drawOutcome, withButton, withTarget } from "../../outcome/outcome.js";
import { OUTCOME_BUTTON } from "../../automation/outcome-chat-button.js";

export const characterShowJokerTableAction = async (actor) => {
  const draw = await drawJokerTable();
  const outcome = await asyncPipe(
    drawOutcome({
      type: "joker-table",
      title: game.i18n.localize("PB.JokerTable"),
      draw,
    }),
    withTarget({ actor }),
    withButton({
      title: game.i18n.localize("PB.ApplyJokerTableButton"),
      type: OUTCOME_BUTTON.APPLY_JOKER_TABLE,
    }),
  )();

  return showGenericCard({
    actor,
    title: game.i18n.localize("PB.JokerTable"),
    outcomes: [outcome],
  });
};
