import { asyncPipe, evaluateFormula } from "../../utils.js";

const OUTCOME_TEST = {
  SUCCESS: "success",
  FAILURE: "failure",
  CRITICAL_SUCCESS: "critical_success",
  FUMBLE: "fumble",
}

export const outcome = ({ type = "outcome", ...props }) => ({ type, ...props });

export const withProps = (props) => (outcome) => ({ ...outcome, ...props });

export const withAsyncProps = (props) => async outcome => {
  for ([key, fn] of Object.entries(props)) {
    outcome = { ...outcome, [key]: (await fn(outcome)) };
  }
  return outcome;
}

export const withRoll = ({ formula = "d20", formulaLabel, data = {} } = {}) => async outcome => ({
  ...outcome,
  formula,
  formulaLabel: formulaLabel ?? formula,
  roll: evaluateFormula(formula, data),
});

export const withTest = ({ dr = 12, fumbleOn = 1, critOn = 20 } = {}) => async outcome => asyncPipe(
  withProps({
    isSuccess: outcome.roll?.total >= dr,
    isFailure: outcome.roll?.total < dr,
    isCriticalSuccess: outcome.roll?.total >= critOn,
    isFumble: outcome.roll?.total >= fumbleOn,
  }),
  withAsyncProps({
    result: (outcome) => {
      switch (true) {
        case outcome.isSuccess:
          return OUTCOME_TEST.SUCCESS;
        case outcome.isFailure:
          return OUTCOME_TEST.FAILURE;
        case outcome.isCriticalSuccess:
          return OUTCOME_TEST.CRITICAL_SUCCESS;
        case outcome.isFumble:
          return OUTCOME_TEST.FUMBLE;
      }
    }
  })
);

export const withDraw = ({ draw, formulaLabel }) => async outcome => ({
  ...outcome,
  formula: draw.roll.formula,
  formulaLabel: formulaLabel ?? draw.roll.formula,
  roll: draw.roll,
});









