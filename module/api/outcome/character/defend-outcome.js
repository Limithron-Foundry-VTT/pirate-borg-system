import { asyncPipe } from "../../../utils.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { createTakeDamageButton } from "../../automation/buttons.js";
import { withAnimation, withButton, withTarget } from "../automation-outcome.js";
import { testOutcome, withAsyncProps } from "../outcome.js";

const getTitle = ({ isFumble = false, isCriticalSuccess = false, isSuccess = false, isFailure = false }) => {
  switch (true) {
    case isFumble:
      return "PB.AttackFumble";
    case isCriticalSuccess:
      return "PB.DefendCrit";
    case isSuccess:
      return "PB.Dodge";
    case isFailure:
      return "PB.YouAreHit";
  }
};

const getDescription = ({ isFumble = false, isCriticalSuccess = false }) => {
  switch (true) {
    case isFumble:
      return "PB.DefendFumbleText";
    case isCriticalSuccess:
      return "PB.DefendCritText";
  }
};

const getButton = (outcome) => {
  switch (true) {
    case outcome.isFailure:
    case outcome.isFumble:
      return createTakeDamageButton({ outcome });
  }
};

const getDamageFormula = ({ actor, outcome, damageFormula = "", targetToken } = {}) => {
  const damage = outcome.isFumble ? `(${damageFormula}) * 2` : damageFormula;
  return targetToken?.actor.getScaledDamageFormula(actor, damage) ?? damage;
};

export const createDefendOutcome = async ({ actor, dr = 12, damageFormula = "", armorFormula = "", targetToken }) =>
  asyncPipe(
    testOutcome({
      type: "defend",
      formula: `d20+@abilities.agility.value`,
      formulaLabel: game.i18n.localize(CONFIG.PB.abilities.agility),
      data: actor.getRollData(),
      dr
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
      description: (outcome) => game.i18n.localize(getDescription(outcome)),
      armorFormula: () => armorFormula + (actor.equippedHat?.reduceDamage ? " + 1" : ""),
      damageFormula: (outcome) => getDamageFormula({ actor, outcome, damageFormula, targetToken }),
    }),
    withButton(getButton),
    withTarget({ actor, targetToken }),
    withAnimation({ type: ANIMATION_TYPE.DEFEND }),
  )();
