import { showGenericCard } from "../../../chat-message/generic-card.js";
import { drawRelic, drawRitual, executeCompendiumMacro, findTableItems } from "../../../compendium.js";
import { handleActorGettingBetterItems } from "../../generator/character-generator.js";
import { createRollAbilityOutcome } from "../../outcome/character/get-better/roll-ability-outcome.js";
import { createRollHPOutcome } from "../../outcome/character/get-better/roll-hp-outcome.js";
import { createRollLootOutcome } from "../../outcome/character/get-better/roll-loot-outcome.js";
import { createRollSilverOutcome } from "../../outcome/character/get-better/roll-silver-outcome.js";
import { createDrawOutcome } from "../../outcome/draw-outcome.js";
import { createOutcome } from "../../outcome/outcome.js";

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
    ...(await rollLoot(actor)),
    ...((await rollGetBetterItems(actor)) ?? []),
  ];

  await showGenericCard({
    actor,
    title: game.i18n.localize("PB.GetBetter"),
    outcomes,
  });

  await invokeGettingBetterMacro(actor);
};

const invokeGettingBetterMacro = async (actor) => {
  const cls = actor.getCharacterClass();
  await executeCompendiumMacro(cls.getData().gettingBetterMacro, {
    actor,
    item: cls,
  });
  const baseClass = await actor.getCharacterBaseClassItem();
  if (baseClass) {
    await executeCompendiumMacro(baseClass.getData().gettingBetterMacro, {
      actor,
      item: baseClass,
    });
  }
};

/**
 * @param {PBActor} actor
 * @returns {Promise.<Array.<Outcome>>}
 */
const rollHP = async (actor) => {
  const outcome = await createRollHPOutcome({
    hp: actor.attributes.hp.max,
  });
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
  const outcomes = [outcome];
  switch (true) {
    case outcome.total === 4:
      outcomes.push(await rollSilver(actor));
      break;
    case outcome.total === 5:
      outcomes.push(await rollRelic(actor));
      break;
    case outcome.total === 6:
      outcomes.push(await rollRitual(actor));
      break;
  }

  return outcomes;
};

const rollSilver = async (actor) => {
  const outcome = await createRollSilverOutcome();
  await actor.updateSilver(actor.silver + outcome.total);
  return outcome;
};

const rollRelic = async (actor) => {
  const rollTableDraw = await drawRelic();
  const item = (await findTableItems(rollTableDraw.results))[0];

  const outcome = await createDrawOutcome({
    rollTableDraw,
    description: game.i18n.format("PB.GetBetterLootRelic", { link: item.link }),
  });

  await actor.createEmbeddedDocuments("Item", [item.data]);

  return outcome;
};

const rollRitual = async (actor) => {
  const rollTableDraw = await drawRitual();
  const item = (await findTableItems(rollTableDraw.results))[0];

  const outcome = await createDrawOutcome({
    rollTableDraw,
    description: game.i18n.format("PB.GetBetterLootRitual", {
      link: item.link,
    }),
  });

  await actor.createEmbeddedDocuments("Item", [item.data]);

  return outcome;
};

const rollGetBetterItems = async (actor) => {
  const gettingBetterItems = await handleActorGettingBetterItems(actor);
  if (gettingBetterItems.length === 0) return;
  return [
    await createOutcome({
      title: game.i18n.localize("PB.GettingBetterClassFeatures"),
      description: gettingBetterItems.map((item) => item.link),
    }),
  ];
};
