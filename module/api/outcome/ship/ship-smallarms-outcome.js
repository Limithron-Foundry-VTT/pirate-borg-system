import { asyncPipe } from "../../utils.js";
import { ADVANCED_ANIMATION_TYPE } from "../../animation/advanced-animation.js";
import { ANIMATION_TYPE } from "../../animation/outcome-animation.js";
import { createInflictDamageButton } from "../../automation/buttons.js";
import { withAdvancedAnimation, withAnimation, withButton, withTarget } from "../automation-outcome.js";
import { testOutcome, withAsyncProps } from "../outcome.js";

const getTitle = ({ isFumble = false, isCriticalSuccess = false, isSuccess = false, isFailure = false }) => {
  switch (true) {
    case isFumble:
      return "PB.AttackFumble";
    case isCriticalSuccess:
      return "PB.AttackCrit";
    case isSuccess:
      return "PB.Hit";
    case isFailure:
      return "PB.Miss";
  }
};

const getDescription = ({ isFumble = false, isCriticalSuccess = false }) => {
  switch (true) {
    case isFumble:
      return "PB.ShipDealDamageFumble";
    case isCriticalSuccess:
      return "PB.ShipDealDamageCritical";
  }
};

const getButton = (outcome) => {
  switch (true) {
    case outcome.isCriticalSuccess:
    case outcome.isSuccess:
      return createInflictDamageButton({ outcome });
  }
};

const getDamageFormula = ({ actor, outcome, targetToken }) => {
  const damageFormula = outcome.isCriticalSuccess ? `(${actor.smallArmsDie}) * 2` : actor.smallArmsDie;
  return actor.getScaledDamageFormula(targetToken?.actor, damageFormula);
};

export const createSmallarmsOutcome = async ({ actor, crew, dr = 12, armorFormula = "", targetToken }) =>
  asyncPipe(
    testOutcome({
      type: "crew-attack", 
      armorFormula,
      formula: crew ? "d20 + @abilities.skill.value + @crew.abilities.presence.value" : "d20 + @abilities.skill.value",
      formulaLabel: crew ? "d20 + Crew Skill + PC Presence" : "d20 + Crew Skill",
      data: { ...actor.getRollData(), crew: crew?.getRollData() },
      dr,
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.localize(getTitle(outcome)),
      description: (outcome) => game.i18n.localize(getDescription(outcome)),
      damageFormula: (outcome) => getDamageFormula({ actor, outcome, targetToken }),
    }),
    withButton(getButton),
    withTarget({ actor, targetToken }),
    withAnimation({ type: ANIMATION_TYPE.ATTACK }),
    withAdvancedAnimation({ type: ADVANCED_ANIMATION_TYPE.SMALLARMS }),
  )();
