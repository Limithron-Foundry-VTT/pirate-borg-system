import {
  ADVANCED_ANIMATION_TYPE,
  playBroadsidesAdvancedAnimation,
  playBrokenAdvancedAnimation,
  playComeAboutAdvancedAnimation,
  playDropAnchorAdvancedAnimation,
  playFullSailAdvancedAnimation,
  playHealAdvancedAnimation,
  playInfectedAdvancedAnimation,
  playInvokeRelicAdvancedAnimation,
  playInvokeRitualAdvancedAnimation,
  playSingShantyAdvancedAnimation,
  playRamAdvancedAnimation,
  playRepairAdvancedAnimation,
  playSinkingAdvancedAnimation,
  playSmallarmsAdvancedAnimation,
  playStarvationAdvancedAnimation,
  playTestRelicAdvancedAnimation,
  playWeighAnchorAdvancedAnimation,
  playMysticalMishapAdvancedAnimation,
  playDefendAdvancedAnimation,
  playItemAdvancedAnimation,
} from "../api/animation/advanced-animation.js";
import {
  ANIMATION_TYPE,
  playAttackOutcomeAnimation,
  playBrokenOrDeadOutcomeAnimation,
  playDefendOutcomeAnimation,
  playHealOutcomeAnimation,
  playInfectedOutcomeAnimation,
  playInflictDamageOutcomeAnimation,
  playMysticalMishapOutcomeAnimation,
  playReloadingOutcomeAnimation,
  playSimpleOutcomeAnimation,
  playStarvationOutcomeAnimation,
  playTakeDamageOutcomeAnimation,
} from "../api/animation/outcome-animation.js";
import { OutcomeAutomation } from "../api/automation/outcome-automation.js";
import { OUTCOME_BUTTON, OutcomeChatButton } from "../api/automation/outcome-chat-button.js";
import { chatTestRelicButtonAction } from "../api/action/chat/chat-test-relic-button-action.js";
import { chatMysticalMyshapButtonAction } from "../api/action/chat/chat-mystical-mishap-button-action.js";
import { chatShipRepairButtonAction } from "../api/action/chat/chat-ship-repair-button-action.js";
import { chatTakeDamageButtonAction } from "../api/action/chat/chat-take-damage-button-action.js";
import { chatInflictDamageButtonAction } from "../api/action/chat/chat-inflict-damage-button-action.js";
import { applyHealOutcome, applyInflictDamageOutcome, applyTakeDamageOutcome, DAMAGE_TYPE } from "../api/automation/outcome-damage.js";

export const configureAutomation = () => {
  // Basic outcome animations
  OutcomeAutomation.register({ type: ANIMATION_TYPE.RELOADING, execute: playReloadingOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.ATTACK, execute: playAttackOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.DEFEND, execute: playDefendOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.SIMPLE, execute: playSimpleOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.BROKEN, execute: playBrokenOrDeadOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.STARVATION, execute: playStarvationOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.INFECTED, execute: playInfectedOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.TAKE_DAMAGE, execute: playTakeDamageOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.INFLICT_DAMAGE, execute: playInflictDamageOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.HEAL, execute: playHealOutcomeAnimation });
  OutcomeAutomation.register({ type: ANIMATION_TYPE.MYSTICAL_MISHAP, execute: playMysticalMishapOutcomeAnimation });

  // Automatic Damage application
  OutcomeAutomation.register({ type: DAMAGE_TYPE.HEAL, execute: applyHealOutcome });
  OutcomeAutomation.register({ type: DAMAGE_TYPE.INFLICT, execute: applyInflictDamageOutcome });
  OutcomeAutomation.register({ type: DAMAGE_TYPE.TAKE, execute: applyTakeDamageOutcome });

  // Advanced Animation
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.ITEM, execute: playItemAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.DEFEND, execute: playDefendAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.BROADSIDES, execute: playBroadsidesAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.SMALLARMS, execute: playSmallarmsAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.RAM, execute: playRamAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.COME_ABOUT, execute: playComeAboutAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.FULL_SAIL, execute: playFullSailAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.REPAIR, execute: playRepairAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.WEIGH_ANCHOR, execute: playWeighAnchorAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.DROP_ANCHOR, execute: playDropAnchorAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.SINKING, execute: playSinkingAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.SING_SHANTY, execute: playSingShantyAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.BROKEN, execute: playBrokenAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.STARVATION, execute: playStarvationAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.INFECTED, execute: playInfectedAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.HEAL, execute: playHealAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.INVOKE_RELIC, execute: playInvokeRelicAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.TEST_RELIC, execute: playTestRelicAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.INVOKE_RITUAL, execute: playInvokeRitualAdvancedAnimation });
  OutcomeAutomation.register({ type: ADVANCED_ANIMATION_TYPE.MYSTICAL_MISHAP, execute: playMysticalMishapAdvancedAnimation });

  // Chat Buttons
  OutcomeChatButton.register({ type: OUTCOME_BUTTON.ANCIENT_RELIC, execute: chatTestRelicButtonAction });
  OutcomeChatButton.register({ type: OUTCOME_BUTTON.MYSTICAL_MISHAP, execute: chatMysticalMyshapButtonAction });
  OutcomeChatButton.register({ type: OUTCOME_BUTTON.REPAIR_CREW_ACTION, execute: chatShipRepairButtonAction });
  OutcomeChatButton.register({ type: OUTCOME_BUTTON.TAKE_DAMAGE, execute: chatTakeDamageButtonAction });
  OutcomeChatButton.register({ type: OUTCOME_BUTTON.INFLICT_DAMAGE, execute: chatInflictDamageButtonAction });
};
