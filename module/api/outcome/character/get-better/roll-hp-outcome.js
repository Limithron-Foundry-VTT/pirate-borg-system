import { asyncPipe } from "../../../utils.js";
import { rollOutcome, withAsyncProps, withWhen } from "../../outcome.js";

/**
 * @param {String} hp
 * @return {Promise<Object>}
 */
export const createRollHPOutcome = async ({ hp }) =>
  asyncPipe(
    rollOutcome({
      type: "get-better-roll-hp",
      title: game.i18n.localize("PB.HP"),
      formula: "6d10",
      formulaLabel: game.i18n.format("PB.GetBetterFormula", { hp }),
    }),
    withAsyncProps({
      hasGainHp: (outcome) => outcome.roll.total >= hp,
    }),
    withWhen(
      (outcome) => outcome.hasGainHp,
      withAsyncProps({
        secondaryOutcome: asyncPipe(
          rollOutcome({ formula: "1d6" }),
          withAsyncProps({
            description: (outcome) => game.i18n.format("PB.GetBetterHP", { hp: outcome.roll.total }),
          }),
        ),
        newHP: (outcome) => outcome.secondaryOutcome.roll.total + hp,
      }),
    ),
    withWhen(
      (outcome) => !outcome.hasGainHp,
      withAsyncProps({
        description: () => game.i18n.localize("PB.Unchanged"),
        newHP: () => hp,
      }),
    ),
  )();
