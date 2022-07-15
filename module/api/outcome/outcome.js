import { asyncPipe, evaluateFormula } from "../utils.js";
import { getInitiatorToken } from "../targeting.js";

export const OUTCOME_TEST = {
  SUCCESS: "success",
  FAILURE: "failure",
  CRITICAL_SUCCESS: "critical_success",
  FUMBLE: "fumble",
};

export const outcome =
  ({ type = "outcome", title = "", description = "", ...props }) =>
  () => ({
    id: randomID(),
    type,
    title,
    description,
    ...props,
  });

export const drawOutcome = ({ type = "draw", title, description, draw, ...props } = {}) =>
  asyncPipe(outcome({ type, title, description, ...props }), withDraw({ draw }));

export const rollOutcome = ({ type = "roll", title, description, formula, formulaLabel, data, ...props } = {}) =>
  asyncPipe(outcome({ type, title, description, ...props }), withRoll({ formula, formulaLabel, data }));

export const testOutcome = ({ type = "test", title, description, formula, formulaLabel, data, dr, fumbleOn, critOn, ...props } = {}) =>
  asyncPipe(outcome({ type, title, description, ...props }), withRoll({ formula, formulaLabel, data }), withTest({ dr, fumbleOn, critOn }));

export const withProps =
  ({ ...props }) =>
  (outcome) => ({ ...outcome, ...props });

export const withWhen = (cond, f) => async (outcome) => (await cond(outcome)) ? f(outcome) : outcome;

export const withAsyncProps = (props) => async (outcome) => {
  for (const [key, fn] of Object.entries(props)) {
    outcome = { ...outcome, [key]: await fn(outcome) };
  }
  return outcome;
};

export const withRoll =
  ({ formula = "d20", formulaLabel = `${formula}`, data = {} } = {}) =>
  async (outcome) => ({
    ...outcome,
    formula,
    formulaLabel: formulaLabel ?? formula,
    roll: await evaluateFormula(formula, data),
  });

export const withTest =
  ({ dr = 12, fumbleOn = 1, critOn = 20 } = {}) =>
  (outcome) =>
    asyncPipe(
      withProps({
        dr,
        fumbleOn,
        critOn,
        isSuccess: outcome.roll.total >= dr,
        isFailure: outcome.roll.total < dr,
        isCriticalSuccess: outcome.roll.terms[0].results[0].result >= critOn,
        isFumble: outcome.roll.terms[0].results[0].result <= fumbleOn,
      }),
      withAsyncProps({
        result: (outcome) => {
          switch (true) {
            case outcome.isCriticalSuccess:
              return OUTCOME_TEST.CRITICAL_SUCCESS;
            case outcome.isFumble:
              return OUTCOME_TEST.FUMBLE;
            case outcome.isSuccess:
              return OUTCOME_TEST.SUCCESS;
            case outcome.isFailure:
              return OUTCOME_TEST.FAILURE;
          }
        },
      })
    )(outcome);

export const withDraw =
  ({ draw }) =>
  async (outcome) => ({
    ...outcome,
    formula: draw.roll.formula,
    formulaLabel: draw.roll.formula,
    roll: draw.roll,
    description: draw.results.map((r) => r.data.text),
  });

export const withTarget =
  ({ actor, targetToken } = {}) =>
  async (outcome) => ({
    ...outcome,
    initiatorToken: getInitiatorToken(actor)?.id,
    targetToken: targetToken?.id,
  });

export const withButton =
  ({ title, type }) =>
  async (outcome) => ({
    ...outcome,
    button: {
      title,
      data: {
        type,
        id: randomID(),
        outcome: outcome.id,
      },
    },
  });

export const withAutomations =
  (...types) =>
  async (outcome) => ({
    ...outcome,
    automations: [...(outcome.automations ?? []), ...types],
  });
