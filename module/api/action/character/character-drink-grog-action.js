import { showGenericCard } from "../../../chat-message/generic-card.js";
import { asyncPipe, evaluateFormula } from "../../utils.js";
import { testOutcome, withAsyncProps, withTarget } from "../../outcome/outcome.js";
import { createHealOutcome } from "../../outcome/actor/heal-outcome.js";
import { isGrogEnabled } from "../../../system/settings.js";
import { buildEffectDuration } from "../../effect-duration.js";

/**
 * Create a Toughness test outcome for drinking grog
 * @param {PBActor} actor
 * @param {Number} dr - The difficulty rating (8 + drinks)
 * @returns {Promise<Object>}
 */
const createDrinkGrogTestOutcome = async ({ actor, dr }) =>
  asyncPipe(
    testOutcome({
      type: "drink-grog-test",
      formula: `d20+@abilities.toughness.value`,
      formulaLabel: `d20 + ${game.i18n.localize("PB.AbilityToughness")}`,
      data: actor.getRollData(),
      dr,
    }),
    withAsyncProps({
      title: () => game.i18n.localize("PB.GrogToughnessTest"),
    }),
    withTarget({ actor }),
  )();

/**
 * Create a vomiting duration roll outcome
 * @returns {Promise<Object>}
 */
const createVomitingDurationOutcome = async () =>
  asyncPipe(
    async () => ({
      id: foundry.utils.randomID(),
      type: "vomiting-duration",
      formula: "d2",
      formulaLabel: "d2",
      roll: await evaluateFormula("d2"),
    }),
    withAsyncProps({
      title: (outcome) => game.i18n.format("PB.GrogVomitingDuration", { rounds: outcome.roll.total }),
      rounds: (outcome) => outcome.roll.total,
    }),
  )();

/**
 * Apply the Vomiting effect on the actor
 * Vomiting is a status indicator for d2 rounds (no specific mechanical effect defined in rules)
 * Only one vomiting effect can exist at a time - new vomiting replaces existing
 * @param {PBActor} actor
 * @param {Number} rounds - Duration in rounds
 * @param {PBItem} grogItem - The grog item that caused the vomiting
 */
const applyVomitingEffect = async (actor, rounds, grogItem) => {
  // Remove any existing vomiting effect first
  const existingVomiting = actor.effects.find(
    (e) => e.statuses?.has(game.pirateborg.config.systemEffects.vomiting.id) || e.getFlag(CONFIG.PB.flagScope, "isVomiting"),
  );
  if (existingVomiting) {
    await existingVomiting.delete();
  }

  const combatStarted = game.combat?.started;
  const effectData = {
    name: game.i18n.localize(game.pirateborg.config.systemEffects.vomiting.name),
    img: game.pirateborg.config.systemEffects.vomiting.img,
    origin: grogItem?.uuid || null,
    statuses: [game.pirateborg.config.systemEffects.vomiting.id],
    duration: buildEffectDuration({
      rounds,
      startRound: combatStarted ? game.combat.round : undefined,
      startTurn: combatStarted ? game.combat.turn : undefined,
    }),
    flags: {
      [CONFIG.PB.flagScope]: {
        isVomiting: true,
      },
    },
  };

  await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
};

/**
 * Find a grog item in actor's inventory
 * @param {PBActor} actor
 * @returns {PBItem|null}
 */
const findGrogItem = (actor) => {
  return actor.items.find((item) => item.type === CONFIG.PB.itemTypes.grog && item.system.quantity > 0);
};

/**
 * Main action for drinking grog
 * @param {PBActor} actor
 * @returns {Promise<ChatMessage>}
 */
export const characterDrinkGrogAction = async (actor) => {
  // Check if grog mechanics are enabled
  if (!isGrogEnabled()) {
    return;
  }

  // Find a grog item in inventory
  const grogItem = findGrogItem(actor);
  if (!grogItem) {
    ui.notifications.warn(game.i18n.localize("PB.GrogNoGrog"));
    return;
  }

  const outcomes = [];

  // Get current grog state
  const currentDrinks = actor.system.attributes?.grog?.drinks ?? 0;

  // New drink count (before the test, we count this drink)
  const newDrinks = currentDrinks + 1;

  // Calculate DR: 8 + number of drinks in the last hour
  const dr = 8 + newDrinks;

  // Create the toughness test outcome
  const testOutcomeResult = await createDrinkGrogTestOutcome({ actor, dr });
  outcomes.push(testOutcomeResult);

  // Decrement drink quantity - get fresh value and ensure it doesn't go below 0
  const currentQuantity = grogItem.system.quantity ?? 1;
  const newQuantity = Math.max(0, currentQuantity - 1);
  await grogItem.update({
    "system.quantity": newQuantity,
  });

  // Update grog tracking data (hours = drinks, they're the same)
  await actor.update({
    "system.attributes.grog.drinks": newDrinks,
    "system.attributes.grog.hoursRemaining": newDrinks,
  });

  if (testOutcomeResult.isSuccess || testOutcomeResult.isCriticalSuccess) {
    // Success: heal d4 HP
    const healOutcome = await createHealOutcome({ actor, formula: "d4" });
    outcomes.push(healOutcome);
  } else {
    // Failure: vomit for d2 rounds
    const vomitOutcome = await createVomitingDurationOutcome();
    outcomes.push(vomitOutcome);

    // Apply vomiting effect with drink item as source
    await applyVomitingEffect(actor, vomitOutcome.rounds, grogItem);
  }

  return showGenericCard({
    actor,
    title: game.i18n.localize("PB.GrogDrinking"),
    description: game.i18n.format("PB.GrogDrinkDescription", { drinks: newDrinks }),
    outcomes,
  });
};

/**
 * Clear all grog effects from an actor (used during rest)
 * @param {PBActor} actor
 */
export const clearGrogEffects = async (actor) => {
  // Remove grog intoxication effect
  const intoxicationEffect = actor.effects.find((e) => e.getFlag(CONFIG.PB.flagScope, game.pirateborg.config.systemEffects.intoxicated.id));
  if (intoxicationEffect) {
    await intoxicationEffect.delete();
  }

  // Remove vomiting effect
  const vomitingEffect = actor.effects.find((e) => e.statuses?.has(game.pirateborg.config.systemEffects.vomiting.id));
  if (vomitingEffect) {
    await vomitingEffect.delete();
  }

  // Reset grog tracking
  await actor.update({
    "system.attributes.grog.drinks": 0,
    "system.attributes.grog.hoursRemaining": 0,
  });
};

/**
 * Decrement grog drinks/hours and update effects accordingly
 * Since drinks = hours remaining, we decrement both together
 * @param {PBActor} actor
 * @param {Number} hours - Hours to decrement (default 1)
 */
export const decrementGrogHours = async (actor, hours = 1) => {
  const currentDrinks = actor.system.attributes?.grog?.drinks ?? 0;

  if (currentDrinks <= 0) {
    return;
  }

  const newDrinks = Math.max(0, currentDrinks - hours);

  await actor.update({
    "system.attributes.grog.drinks": newDrinks,
    "system.attributes.grog.hoursRemaining": newDrinks,
  });
};
