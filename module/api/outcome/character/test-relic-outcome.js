import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { testOutcome, withAsyncProps, withAutomations, withTarget } from "../outcome.js";

/**
 * @param {Boolean} isFumble
 * @param {Boolean} isCriticalSuccess
 * @param {Boolean} isSuccess
 * @param {Boolean} isFailure
 * @return {String}
 */
const getTitle = ({ isFumble, isCriticalSuccess, isSuccess, isFailure }) => {
  switch (true) {
    case isFumble:
      return "PB.InvokableFumble";
    case isCriticalSuccess:
      return "PB.InvokableCriticalSuccess";
    case isSuccess:
      return "PB.InvokableSuccess";
    case isFailure:
      return "PB.InvokableFailure";
  }
};

/**
 * @param {Boolean} isFumble
 * @param {Boolean} isFailure
 * @return {string}
 */
const getDescription = ({ isFumble = false, isFailure = false }) => {
  switch (true) {
    case isFumble:
      return "PB.InvokableRelicFumble";
    case isFailure:
      return "PB.InvokableRelicFailure";
  }
};

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createTestRelicOutcome = async ({ actor }) =>
  asyncPipe(
    testOutcome({
      type: "test-relic",
      formula: "d20+@abilities.spirit.value",
      formulaLabel: `1d20 + ${game.i18n.localize("PB.AbilitySpirit")}`,
      data: actor.getRollData(),
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
      description: (outcome) => game.i18n.localize(getDescription(outcome)),
    }),
    withTarget({ actor }),
    withAutomations(ANIMATION_TYPE.SIMPLE, ADVANCED_ANIMATION_TYPE.TEST_RELIC)
  )();
