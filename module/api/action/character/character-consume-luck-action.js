import { asyncPipe } from "../../utils.js";
import { outcome, withTarget } from "../../outcome/outcome.js";
import { runLuckConsumeFeatures } from "../../luck/luck-consume-features.js";

export const characterConsumeLuckAction = async (actor) => {
  if (actor.effectiveLuck < 1) {
    ui.notifications.warn(game.i18n.localize("PB.NoLuckToConsume"));
    return null;
  }

  const newValue = Math.max(0, (actor.luck?.value || 0) - 1);
  await actor.updateLuck({ value: newValue });

  const spendOutcome = await asyncPipe(
    outcome({
      type: "consume-luck",
      title: game.i18n.localize("PB.LuckConsumed"),
    }),
    withTarget({ actor }),
  )();

  const featureOutcomes = await runLuckConsumeFeatures(actor);
  return [spendOutcome, ...featureOutcomes];
};
