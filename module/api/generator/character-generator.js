import { PBActor } from "../../actor/actor.js";
import {
  compendiumInfoFromString,
  drawTableItems,
  drawTableText,
  executeCompendiumMacro,
  findCompendiumItem,
  findItemsFromCompendiumString,
  findTableItems,
  rollTableItems,
} from "../compendium.js";
import { PB } from "../../config.js";
import { evaluateFormula } from "../utils.js";

/**
 * @param {PBItem} cls
 * @returns {Promise.<Actor>}
 */
export const createCharacter = async (cls) => createActorWithCharacter(await rollCharacterForClass(cls));

/**
 * @param {PBActor} actor
 * @param {PBItem} cls
 */
export const regenerateActor = async (actor, cls) => {
  await updateActorWithCharacter(actor, await rollCharacterForClass(cls));
};

/**
 * @param {Object} characterData
 * @returns {Promise.<Actor>}
 */
export const createActorWithCharacter = async (characterData) => {
  const data = characterToActorData(characterData);
  const actor = await PBActor.create(data);
  await invokeStartingMacro(actor);
  
  Hooks.call('createCharacter', actor);

  return actor;
};

/**
 * @param {PBActor} actor
 * @param {Object} characterData
 */
export const updateActorWithCharacter = async (actor, characterData) => {
  const data = characterToActorData(characterData);
  await actor.deleteEmbeddedDocuments("Item", [], {
    deleteAll: true,
    render: false,
  });
  await actor.update(data);
  for (const token of actor.getActiveTokens()) {
    await token.document.update({
      img: actor.img,
      name: actor.name,
    });
  }

  Hooks.call('updateCharacter', actor);

  await invokeStartingMacro(actor);
};

/**
 * @param {PBActor} actor
 */
export const invokeStartingMacro = async (actor) => {
  const cls = actor.characterClass;
  await executeCompendiumMacro(cls.getData().startingMacro, {
    actor,
    item: cls,
  });
  const baseClass = actor.characterBaseClass;
  if (baseClass) {
    await executeCompendiumMacro(baseClass.getData().startingMacro, {
      actor,
      item: baseClass,
    });
  }
};

/**
 * @param {String} formula
 * @param {String} bonus
 * @returns {Promise.<Number>}
 */
export const rollAbility = async (formula, bonus) => {
  const abilityRoll = await evaluateFormula(formula);
  const ability = abilityBonus(abilityRoll.total);
  const abilityWithBonus = bonus ? ability + parseInt(bonus, 10) : ability;
  return abilityWithBonus < -3 ? -3 : abilityWithBonus;
};

/**
 * @returns {Promise.<String>}
 */
export const rollName = async () => {
  const firstName = await drawTableText(...compendiumInfoFromString(PB.characterGenerator.firstNamesPack));
  const nickName = await drawTableText(...compendiumInfoFromString(PB.characterGenerator.nickNamesPack));
  const lastName = await drawTableText(...compendiumInfoFromString(PB.characterGenerator.lastNamesPack));
  return `${firstName} “${nickName}” ${lastName}`;
};

/**
 * @param {Object} data
 * @returns {Promise.<Object>}
 */
export const rollAbilities = async (data) => ({
  strength: await rollAbility(data.startingAbilityScoreFormula, data.startingStrengthBonus),
  agility: await rollAbility(data.startingAbilityScoreFormula, data.startingAgilityBonus),
  presence: await rollAbility(data.startingAbilityScoreFormula, data.startingPresenceBonus),
  toughness: await rollAbility(data.startingAbilityScoreFormula, data.startingToughnessBonus),
  spirit: await rollAbility(data.startingAbilityScoreFormula, data.startingSpiritBonus),
});

/**
 * @param {String} luckDie
 * @returns {Promise.<Number>}
 */
export const rollLuck = async (luckDie) => (await evaluateFormula(luckDie)).total;

/**
 * @param {String} startingHitPoints
 * @param {Number} toughness
 * @returns {Promise.<Number>}
 */
export const rollHitPoints = async (startingHitPoints, toughness) => {
  const roll = await evaluateFormula(startingHitPoints);
  const hp = roll.total + toughness;
  return hp <= 0 ? 1 : hp;
};

/**
 * @param {PBItem} background
 * @returns {Promise.<Number>}
 */
export const rollSilver = async (background) => (await evaluateFormula(background.startingGold)).total;

/**
 * @param {String} formula
 * @returns {Promise.<Array.<PBItem>>}
 */
export const rollArmor = async (formula) => {
  const [compendium, table] = compendiumInfoFromString(PB.characterGenerator.armorsRollTable);
  return rollTableItems(compendium, table, formula);
};

/**
 * @param {String} formula
 * @returns {Promise.<Array.<PBItem>>}
 */
export const rollHat = async (formula) => {
  const [compendium, table] = compendiumInfoFromString(PB.characterGenerator.hatsRollTable);
  return rollTableItems(compendium, table, formula);
};

/**
 * @param {String} formula
 * @returns {Promise.<Array.<PBItem>>}
 */
export const rollWeapon = async (formula) => {
  const [compendium, table] = compendiumInfoFromString(PB.characterGenerator.weaponsRollTable);
  return rollTableItems(compendium, table, formula);
};

/**
 * @returns {Promise.<Array.<PBItem>>}
 */
export const rollBaseTables = async () => {
  let items = [];
  for (const compendiumTable of PB.characterGenerator.baseTables) {
    const [compendium, table, quantity = 1] = compendiumInfoFromString(compendiumTable);
    items = items.concat(await drawTableItems(compendium, table, quantity));
  }
  return items;
};

/**
 * @param {String} rollString
 * @returns {Promise.<Array.<PBItem>>}
 */
export const rollRollItems = async (rollString) => {
  const compendiumTables = rollString.split("\n").filter((item) => item);
  let results = [];
  for (const compendiumTable of compendiumTables) {
    const [compendium, table, quantity = 1] = compendiumInfoFromString(compendiumTable);
    results = results.concat(await drawTableItems(compendium, table, quantity));
  }
  return results;
};

/**
 * @param {Array.<PBItem>} items
 * @returns {Promise.<Array.<PBItem>>}
 */
export const findStartingBonusItems = async (items) => {
  let results = [];
  for (const feature of items) {
    if (feature.startingBonusItems) {
      results = results.concat(await findItemsFromCompendiumString(feature.startingBonusItems));
    }
  }
  return results;
};

/**
 * @param {Array.<PBItem>} items
 * @returns {Promise.<Array.<PBItem>>}
 */
export const findStartingBonusRollsItems = async (items) => {
  let results = [];
  for (const feature of items) {
    if (feature.startingBonusRolls) {
      results = results.concat(await rollRollItems(feature.startingBonusRolls));
    }
  }
  return results;
};

/**
 * @param {Actor} actor
 * @returns {Promise.<Array.<PBItem>>}
 */
export const handleActorGettingBetterItems = async (actor) => {
  const actorClass = actor.characterClass;
  const baseClass = actor.characterBaseClass;
  let items = [];
  if (actorClass.getData().gettingBetterRolls) {
    items = items.concat(await handleClassGettingBetterItems(actor, actorClass.getData().gettingBetterRolls));
  }
  if (baseClass && baseClass.getData().gettingBetterRolls) {
    items = items.concat(await handleClassGettingBetterItems(actor, baseClass.getData().gettingBetterRolls));
  }
  return items;
};

/**
 * @param {Actor} actor
 * @param {String} compendiumTable
 * @returns {Promise.<Array.<PBItem>>}
 */
export const handleClassGettingBetterItems = async (actor, compendiumTable) => {
  const items = await drawGettingBetterRollTable(actor, compendiumTable);
  await updateOrCreateActorItems(actor, items);
  return items;
};

/**
 * @param {Actor} actor
 * @param {Array.<PBItem>} items
 */
const updateOrCreateActorItems = async (actor, items) => {
  // here we assume the first item is the "feature"
  const item = items[0];
  const actorItem = actor.items.find((i) => i.name === item?.name);
  if (actorItem) {
    const actorItemQuantity = actorItem ? actorItem.quantity || 1 : 0;
    await actorItem.updateData("quantity", actorItemQuantity + 1);
  } else {
    await actor.createEmbeddedDocuments(
      "Item",
      items.map((item) => item.toObject(false))
    );
  }
};

/**
 * @param {Actor} actor
 * @param {String} compendiumTable
 * @returns {Promise.<Array.<PBItem>>}
 */
const drawGettingBetterRollTable = async (actor, compendiumTable) => {
  const [compendium, table] = compendiumInfoFromString(compendiumTable);
  let items = [];

  if (compendium && table) {
    const compendiumRollTable = await findCompendiumItem(compendium, table);
    const rollTable = compendiumRollTable.clone({ replacement: false });

    // draw until we found a valid item
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const draw = await rollTable.draw({ displayChat: false });
      items = await findTableItems(draw.results);

      if (!items.length) {
        break;
      }

      const item = items[0];
      const actorItem = actor.items.find((i) => i.name === item.name);
      const noLimits = item.maxQuantity === 0;
      const actorItemQuantity = actorItem ? actorItem.quantity || 1 : 0;
      const itemMaxQuantity = item.maxQuantity || 1;

      if (noLimits || actorItemQuantity < itemMaxQuantity) {
        break;
      }
      draw.results.forEach((result) => {
        //V10
        if (result.drawn === false) {
          result.drawn = true;
        } else {
          result.data.drawn = true;
        }
      });
    }
  }
  return items;
};

/**
 * @param {PBItem} cls
 * @param {Array.<PBItem>} items
 * @returns {String}
 */
export const generateDescription = (cls, items) => {
  const thingOfImportance = items.find((item) => item.featureType === "Thing of Importance");
  const description = items
    .filter((item) => item.type === CONFIG.PB.itemTypes.feature || item.type === CONFIG.PB.itemTypes.background)
    .filter((item) => item.featureType !== "Thing of Importance")
    .map((item) => item.name)
    .concat([
      game.i18n.format("PB.YouOwn", {
        item: thingOfImportance.name,
      }),
    ])
    .join("...");

  return `<p>${cls.flavorText}</p><p>${description}</p>`;
};

/**
 * @param {PBItem} cls
 * @returns {Object}
 */
export const rollCharacterForClass = async (cls) => {
  console.log(`Creating new ${cls.name}`);

  //const { data } = cls.getData();

  const name = await rollName();
  const abilities = await rollAbilities(cls);
  const luck = await rollLuck(cls.luckDie);
  const hitPoints = await rollHitPoints(cls.startingHitPoints, abilities.toughness);
  const baseTables = await rollBaseTables();

  const background = baseTables.find((item) => item.type === CONFIG.PB.itemTypes.background);
  const features = baseTables.filter((item) => item.type === CONFIG.PB.itemTypes.feature);
  const hasRelic = baseTables.some((item) => item.invokableType === "Ancient Relic");

  const silver = await rollSilver(background);

  const armor = cls.startingArmorTableFormula ? await rollArmor(!hasRelic ? cls.startingArmorTableFormula : "1d6") : [];
  const hat = cls.startingHatTableFormula ? await rollHat(cls.startingHatTableFormula) : [];
  const weapon = cls.startingWeaponTableFormula ? await rollWeapon(cls.startingWeaponTableFormula) : [];

  const startingRollItems = await rollRollItems(cls.startingRolls);
  const startingItems = await findItemsFromCompendiumString(cls.startingItems);

  // Both of the rolls should loop until nothing is returning to have a kind of recursive configuration
  const startingBonusItems = await findStartingBonusItems([...(features || []), ...(startingItems || []), ...(startingRollItems || []), background]);

  const startingBonusRollItems = await findStartingBonusRollsItems([
    ...(features || []),
    ...(startingItems || []),
    ...(startingRollItems || []),
    ...(startingBonusItems || []),
    background,
  ]);

  const description = generateDescription(cls, baseTables);

  const powerUsesRoll = Math.max(0, (await evaluateFormula(`1d4 + ${abilities.spirit}`)).total);
  const extraResourceRoll = Math.max(0, (await evaluateFormula(cls.system.extraResourceFormula.replace("@abilities.spirit.value", abilities.spirit))).total);

  const allDocs = [
    ...baseTables,
    ...(armor || []),
    ...(hat || []),
    ...(weapon || []),
    ...(startingRollItems || []),
    ...(startingItems || []),
    ...(startingBonusItems || []),
    ...(startingBonusRollItems || []),
    cls,
  ];

  return {
    name,
    actorImg: cls.img,
    hitPoints,
    luck,
    ...abilities,
    items: allDocs,
    description,
    silver,
    powerUses: powerUsesRoll,
    extraResourceUses: extraResourceRoll,
  };
};

/**
 * @param {Object} characterData
 * @returns {Object}
 */
const characterToActorData = (characterData) => ({
  name: characterData.name,
  data: {
    abilities: {
      strength: { value: characterData.strength },
      agility: { value: characterData.agility },
      presence: { value: characterData.presence },
      toughness: { value: characterData.toughness },
      spirit: { value: characterData.spirit },
    },
    description: characterData.description,
    attributes: {
      hp: {
        max: characterData.hitPoints,
        value: characterData.hitPoints,
      },
      luck: {
        max: characterData.luck,
        value: characterData.luck,
      },
      rituals: {
        max: characterData.powerUses,
        value: characterData.powerUses,
      },
      extraResource: {
        max: characterData.extraResourceUses,
        value: characterData.extraResourceUses,
      },
    },
    silver: characterData.silver,
    baseClass: characterData.baseClass || "",
  },
  img: characterData.actorImg,
  items: characterData.items.map((i) => {
    if ([CONFIG.PB.itemTypes.weapon, CONFIG.PB.itemTypes.armor, CONFIG.PB.itemTypes.hat].includes(i.type)) {
      i.getData().equipped = true;
    }
    return { ...i.toObject(false), _id: null };
  }),
  token: {
    img: characterData.actorImg,
    name: characterData.name,
    actorLink: true,
    vision: true,
  },
  type: "character",
});

/**
 * @param {Number} rollTotal
 * @returns {Number}
 */
export const abilityBonus = (rollTotal) => {
  if (rollTotal <= 4) {
    return -3;
  }
  if (rollTotal <= 6) {
    return -2;
  }
  if (rollTotal <= 8) {
    return -1;
  }
  if (rollTotal <= 12) {
    return 0;
  }
  if (rollTotal <= 14) {
    return 1;
  }
  if (rollTotal <= 16) {
    return 2;
  }
  // 17 - 20+
  return 3;
};
