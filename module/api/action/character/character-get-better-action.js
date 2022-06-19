import { showGenericCard } from "../../../chat-message/generic-card.js";
import { executeCompendiumMacro } from "../../../compendium.js";
import { handleActorGettingBetterItems } from "../../generator/character-generator.js";
import { createRollAbilityOutcome } from "../../outcome/character/get-better/roll-ability-outcome.js";
import { createRollHPOutcome } from "../../outcome/character/get-better/roll-hp-outcome.js";
import { createRollLootOutcome } from "../../outcome/character/get-better/roll-loot-outcome.js";
import { outcome } from "../../outcome/outcome.js";

/**
 * @param {PBActor} actor
 * @returns {Promise.<ChatMessage>}
 */
export const characterGetBetterAction = async (actor) => {
  const outcomes = [
    await rollHP(actor),
    await rollAbility(actor, CONFIG.PB.abilityKey.strength),
    await rollAbility(actor, CONFIG.PB.abilityKey.agility),
    await rollAbility(actor, CONFIG.PB.abilityKey.presence),
    await rollAbility(actor, CONFIG.PB.abilityKey.toughness),
    await rollAbility(actor, CONFIG.PB.abilityKey.spirit),
    await rollLoot(actor),
    ...((await rollGetBetterItems(actor)) ?? []),
  ];

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.GetBetter"),
    outcomes,
  });

  await invokeGettingBetterMacro(actor);
};

/**
 * @param {PBActor} actor
 * @returns {Promise.<Array.<Outcome>>}
 */
const rollHP = async (actor) => {
  const outcome = await createRollHPOutcome({ hp: actor.attributes.hp.max });
  await actor.updateHp({ max: outcome.newHP });
  return outcome;
};

/**
 * @param {PBActor} actor
 * @param {String} ability
 * @returns {Promise.<Outcome>}
 */
const rollAbility = async (actor, ability) => {
  const outcome = await createRollAbilityOutcome({
    ability: game.i18n.localize(CONFIG.PB.abilities[ability]),
    value: actor.abilities[ability].value,
  });
  await actor.updateData(`abilities.${ability}.value`, outcome.newValue);
  return outcome;
};

const rollLoot = async (actor) => {
  const outcome = await createRollLootOutcome();
  switch (true) {
    case outcome.hasSilver:
      await actor.updateSilver(actor.silver + outcome.secondaryOutcome.total);
      break;
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