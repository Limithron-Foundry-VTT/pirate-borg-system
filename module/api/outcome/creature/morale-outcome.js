import { asyncPipe } from "../../utils.js";
import { rollOutcome, withAsyncProps, withWhen } from "../outcome.js";

/**
 * @param {Boolean} isStandingFirm
 * @param {Boolean} isFleeing
 * @param {Boolean} isSurrendering
 * @return {String}
 */
const getTitle = ({ isStandingFirm = false, isFleeing = false, isSurrendering = false }) => {
  switch (true) {
    case isStandingFirm:
      return "PB.StandsFirm";
    case isFleeing:
      return "PB.MoraleFlees";
    case isSurrendering:
      return "PB.MoraleSurrenders";
  }
};

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createMoraleOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({ type: "morale", formula: "2d6", morale: actor.morale }),
    withAsyncProps({
      isStandingFirm: (outcome) => outcome.roll.total <= actor.morale,
    }),
    withWhen(
      (outcome) => !outcome.isStandingFirm,
      withAsyncProps({
        secondaryOutcome: rollOutcome({ formula: "1d6" }),
      })
    ),
    withAsyncProps({
      isFleeing: (outcome) => outcome.secondaryOutcome?.roll.total <= 3,
      isSurrendering: (outcome) => outcome.secondaryOutcome?.roll.total > 3,
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
    })
  )();
