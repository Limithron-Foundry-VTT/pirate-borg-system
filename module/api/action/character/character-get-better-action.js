import { showGenericCard } from "../../../chat-message/generic-card.js";
import { executeCompendiumMacro } from "../../compendium.js";
import { handleActorGettingBetterItems } from "../../generator/character-generator.js";
import { createRollAbilityOutcome } from "../../outcome/character/get-better/roll-ability-outcome.js";
import { createRollHPOutcome } from "../../outcome/character/get-better/roll-hp-outcome.js";
import { createRollLootOutcome } from "../../outcome/character/get-better/roll-loot-outcome.js";
import { outcome } from "../../outcome/outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise<Object[]>}
 */
export const characterGetBetterAction = async (actor) => {
  const outcomes = [
    await rollHP(actor),
    await rollAbility(actor, CONFIG.PB.ability.strength),
    await rollAbility(actor, CONFIG.PB.ability.agility),
    await rollAbility(actor, CONFIG.PB.ability.presence),
    await rollAbility(actor, CONFIG.PB.ability.toughness),
    await rollAbility(actor, CONFIG.PB.ability.spirit),
    ...((await rollGetBetterItems(actor)) ?? []),
    await rollLoot(actor),
  ];

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.GetBetter"),
    outcomes,
  });

  await invokeGettingBetterMacro(actor);

  return outcomes;
};

/**
 * @param {PBActor} actor
 * @returns {Promise.<Object>}
 */
const rollHP = async (actor) => {
  const outcome = await createRollHPOutcome({ hp: actor.attributes.hp.max });
  await actor.updateData("attributes.hp.max", outcome.newHp);
  return outcome;
};

/**
 * @param {PBActor} actor
 * @param {String} ability
 * @returns {Promise.<Object>}
 */
const rollAbility = async (actor, ability) => {
  // Calculate the ability modifier based on active effects
  let abilityModifier = 0;
  const abilityEffects = actor.effects.filter(
    (effect) => !effect.disabled && !effect.isSuppressed && effect.changes.some((change) => change.key === `system.abilities.${ability}.value`)
  );
  if (abilityEffects.length) {
    // Currently only "ADD" style effects are supported (CONST.ACTIVE_EFFECT_MODES.ADD)
    abilityModifier = abilityEffects.reduce(
      (total, effect) => total + parseInt(effect.changes.find((change) => change.key === `system.abilities.${ability}.value`).value),
      abilityModifier
    );
  }

  const outcome = await createRollAbilityOutcome({
    ability: game.i18n.localize(CONFIG.PB.abilityKey[ability]),
    value: actor.abilities[ability].value - abilityModifier, // Reduce the current attribute value by the effect modifier (to invert the ADD)
  });
  await actor.updateData(`abilities.${ability}.value`, outcome.newValue);
  return outcome;
};

const rollLoot = async (actor) => {
  const outcome = await createRollLootOutcome();
  switch (true) {
    case outcome.hasSilver:
      await actor.updateSilver(actor.silver + outcome.secondaryOutcome.silver);
      break;
    case outcome.hasWeapon:
    case outcome.hasRitual:
    case outcome.hasRelic:
      await actor.createEmbeddedDocuments("Item", [outcome.secondaryOutcome.itemData]);
      break;
  }
  return outcome;
};

const rollGetBetterItems = async (actor) => {
  const gettingBetterItems = await handleActorGettingBetterItems(actor);
  if (gettingBetterItems.length === 0) return;
  return [
    await outcome({
      title: game.i18n.localize("PB.GettingBetterClassFeatures"),
      description: gettingBetterItems.map((item) => item.link),
    })(),
  ];
};

const invokeGettingBetterMacro = async (actor) => {
  const cls = actor.characterClass;
  await executeCompendiumMacro(cls.getData().gettingBetterMacro, { actor, item: cls });

  const baseClass = await actor.characterBaseClass;
  if (baseClass) {
    await executeCompendiumMacro(baseClass.getData().gettingBetterMacro, { actor, item: baseClass });
  }
};
