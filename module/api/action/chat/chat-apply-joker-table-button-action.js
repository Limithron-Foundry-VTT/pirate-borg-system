import { applyJokerTableLuck } from "../../luck/luck-consume-features.js";
import { asyncPipe } from "../../utils.js";
import { outcome, withTarget } from "../../outcome/outcome.js";

export const chatApplyJokerTableButtonAction = async (originalOutcome) => {
  const initiatorToken = canvas.ready ? canvas.tokens?.get(originalOutcome.initiatorToken) : null;
  const initiatorActor = initiatorToken?.actor ?? game.actors.get(originalOutcome.initiatorActor);
  if (!initiatorActor) {
    return null;
  }

  const total = originalOutcome.roll?.total;
  if (typeof total !== "number") {
    return null;
  }

  await applyJokerTableLuck(initiatorActor, total);

  return [
    await asyncPipe(
      outcome({
        type: "joker-table-applied",
        title: game.i18n.localize("PB.JokerTableApplied"),
      }),
      withTarget({ actor: initiatorActor }),
    )(),
  ];
};
