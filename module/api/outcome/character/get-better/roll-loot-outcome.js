import { asyncPipe } from "../../../utils.js";
import { rollOutcome, withAsyncProps } from "../../outcome.js";
import { createRollRelicOutcome } from "./roll-relic-outcome.js";
import { createRollRitualOutcome } from "./roll-ritual-outcome.js";
import { createRollSilverOutcome } from "./roll-silver-outcome.js";
import { createRollWeaponOutcome } from "./roll-weapon-outcome.js";

/**
 * @param {Boolean} hasWeapon
 * @param {Boolean} hasSilver
 * @param {Boolean} hasRelic
 * @param {Boolean} hasRitual
 * @return {Promise<*>}
 */
const getSecondaryOutcome = async ({ hasWeapon = false, hasSilver = false, hasRelic = false, hasRitual = false }) => {
  switch (true) {
    case hasWeapon:
      return createRollWeaponOutcome();
    case hasSilver:
      return createRollSilverOutcome();
    case hasRelic:
      return createRollRelicOutcome();
    case hasRitual:
      return createRollRitualOutcome();
  }
};

/**
 * @return {Promise<Object>}
 */
export const createRollLootOutcome = async () =>
  asyncPipe(
    rollOutcome({
      type: "get-better-roll-loot",
      formula: "d6",
      title: game.i18n.localize("PB.GetBetterLoot"),
    }),
    withAsyncProps({
      hasNothing: (outcome) => outcome.roll.total < 3,
      hasWeapon: (outcome) => outcome.roll.total === 3,
      hasSilver: (outcome) => outcome.roll.total === 4,
      hasRelic: (outcome) => outcome.roll.total === 5,
      hasRitual: (outcome) => outcome.roll.total === 6,
      secondaryOutcome: async (outcome) => getSecondaryOutcome(outcome),
      description: (outcome) => (outcome.hasNothing ? game.i18n.localize("PB.GetBetterLootNothing") : ""),
    }),
  )();
