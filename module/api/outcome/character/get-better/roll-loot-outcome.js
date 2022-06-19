import { asyncPipe } from "../../../utils.js";
import { rollOutcome, withAsyncProps } from "../../outcome.js";
import { createRollRelicOutcome } from "./roll-relic-outcome.js";
import { createRollRitualOutcome } from "./roll-ritual-outcome.js";
import { createRollSilverOutcome } from "./roll-silver-outcome.js";

const getSecondaryOutcome = async ({hasSilver = false, hasRelic = false, hasRitual = false }) => {
  switch (true) {
    case hasSilver:
      return await createRollSilverOutcome();
    case hasRelic:
      return await createRollRelicOutcome();
    case hasRitual:
      return await createRollRitualOutcome();
  }
};

export const createRollLootOutcome = async () =>
  asyncPipe(
    rollOutcome({
      type: "get-better-roll-loot",
      formula: "d6",
      title: game.i18n.localize("PB.GetBetterLoot"),
    }),
    withAsyncProps({
      hasNothing: (outcome) => outcome.roll.total < 4,
      hasSilver: (outcome) => outcome.roll.total === 4,
      hasRelic: (outcome) => outcome.roll.total === 5,
      hasRitual: (outcome) => outcome.roll.total === 6,
      secondaryOutcome: async (outcome) => await getSecondaryOutcome(outcome),
      description: (outcome) => outcome.hasNothing ? game.i18n.localize("PB.GetBetterLootNothing") : "",
    }),
  )();
