import { getInitiatorToken } from "../automation/targeting.js";

export const withTarget =
  ({ actor, targetToken } = {}) =>
  async (outcome) => ({
    ...outcome,
    initiatorToken: getInitiatorToken(actor)?.id,
    targetToken: targetToken?.id,
  });

export const withAnimation =
  ({ type = "" } = {}) =>
  async (outcome) => ({
    ...outcome,
    outcomeAnimation: { type },
  });

export const withAdvancedAnimation =
  ({ type = "", options = {} } = {}) =>
  async (outcome) => ({
    ...outcome,
    advancedAnimation: { type, options },
  });

export const withDamage =
  ({ type = "" } = {}) =>
  async (outcome) => ({
    ...outcome,
    outcomeDamage: { type },
  });

export const withButton = (getButton) => async (outcome) => ({
  ...outcome,
  button: getButton(outcome),
});
