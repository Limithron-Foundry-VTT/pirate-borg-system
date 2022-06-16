import {
  ADVANCED_ANIMATION_TYPE,
  playBroadsidesAdvancedAnimation,
  playBrokenAdvancedAnimation,
  playComeAboutAdvancedAnimation,
  playFullSailAdvancedAnimation,
  playHealAdvancedAnimation,
  playInfectedAdvancedAnimation,
  playRamAdvancedAnimation,
  playRepairAdvancedAnimation,
  playSmallarmsAdvancedAnimation,
  playStarvationAdvancedAnimation,
} from "../api/animation/advanced-animation.js";
import { applyHealOutcome, applyInflictDamageOutcome, applyTakeDamageOutcome, DAMAGE_TYPE } from "../api/automation/outcome-damage.js";
import {
  ANIMATION_TYPE,
  playAttackOutcomeAnimation,
  playDeadOutcomeAnimation,
  playDefendOutcomeAnimation,
  playBrokenOutcomeAnimation,
  playOutcomeInfectedAnimation,
  playReloadingOutcomeAnimation,
  playSimpleOutcomeAnimation,
  playStarvationOutcomeAnimation,
} from "../api/animation/outcome-animation.js";
import { OutcomeAutomation } from "../api/automation/outcome-automation.js";

export const registerAutomation = () => {
  // Basic outcome animations
  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeAnimation?.type === ANIMATION_TYPE.RELOADING,
    execute: playReloadingOutcomeAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeAnimation?.type === ANIMATION_TYPE.ATTACK,
    execute: playAttackOutcomeAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeAnimation?.type === ANIMATION_TYPE.DEFEND,
    execute: playDefendOutcomeAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeAnimation?.type === ANIMATION_TYPE.SIMPLE,
    execute: playSimpleOutcomeAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeAnimation?.type === ANIMATION_TYPE.BROKEN && outcome.isDead,
    execute: playDeadOutcomeAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeAnimation?.type === ANIMATION_TYPE.BROKEN && !outcome.isDead,
    execute: playBrokenOutcomeAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeAnimation?.type === ANIMATION_TYPE.STARVATION,
    execute: playStarvationOutcomeAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeAnimation?.type === ANIMATION_TYPE.INFECTED,
    execute: playOutcomeInfectedAnimation,
  });

  // Automatic Damage application
  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeDamage?.type === DAMAGE_TYPE.HEAL,
    execute: applyHealOutcome,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeDamage?.type === DAMAGE_TYPE.INFLICT,
    execute: applyInflictDamageOutcome,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.outcomeDamage?.type === DAMAGE_TYPE.TAKE,
    execute: applyTakeDamageOutcome,
  });

  // Advanced Animation

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.ITEM,
    execute: async (outcome) => {}, //await playItemAnimation(outcome),
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.DEFEND,
    execute: async (outcome) => {}, //await playDefendOutcomeAnimation(outcome),
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.BROADSIDES,
    execute: playBroadsidesAdvancedAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.SMALLARMS,
    execute: playSmallarmsAdvancedAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.RAM,
    execute: playRamAdvancedAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.COME_ABOUT,
    execute: playComeAboutAdvancedAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.FULL_SAIL,
    execute: playFullSailAdvancedAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.REPAIR,
    execute: playRepairAdvancedAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.BROKEN && outcome.isDead,
    execute: playBrokenAdvancedAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.STARVATION,
    execute: playStarvationAdvancedAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.INFECTED,
    execute: playInfectedAdvancedAnimation,
  });

  OutcomeAutomation.register({
    filter: (outcome) => outcome.advancedAnimation?.type === ADVANCED_ANIMATION_TYPE.HEAL,
    execute: playHealAdvancedAnimation,
  });
};
