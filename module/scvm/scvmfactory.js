import { PBActor } from "../actor/actor.js";
import { PB } from "../config.js";
import { PBItem } from "../item/item.js";
import { executeMacro } from "../macro-helpers.js";

export const createRandomScvm = async () => {
  const clazz = await pickRandomClass();
  await createScvm(clazz);
};

export const createScvm = async (clazz) => {
  const scvm = await rollScvmForClass(clazz);
  await createActorWithScvm(scvm);
};

export const scvmifyActor = async (actor, clazz) => {
  const scvm = await rollScvmForClass(clazz);
  await updateActorWithScvm(actor, scvm);
};

const pickRandomClass = async () => {
  const classPacks = findClassPacks();
  if (classPacks.length === 0) {
    // TODO: error on 0-length classPaths
    return;
  }
  const packName = classPacks[Math.floor(Math.random() * classPacks.length)];
  // TODO: debugging hardcodes
  const pack = game.packs.get(packName);
  const content = await pack.getDocuments();
  return content.find((i) => i.data.type === "class");
};

export const findClassPacks = () => {
  const classPacks = [];
  const packKeys = game.packs.keys();
  for (const packKey of packKeys) {
    const keyParts = packKey.split(".");
    if (keyParts.length === 2) {
      const packName = keyParts[1];
      if (packName.startsWith("class-") && packName.length > 6) {
        classPacks.push(packKey);
      }
    }
  }
  return classPacks;
};

export const classItemFromPack = async (compendiumName) => {
  const compendium = game.packs.get(compendiumName);
  const documents = await compendium.getDocuments();
  return documents.find((i) => i.data.type === "class");
};

/// new
const compendiumInfoFromString = (value) => {
  return value.split(";");
};

export const drawTable = async (compendium, table) => {
  const rollTable = await findCompendiumItem(compendium, table);
  return await rollTable.draw({ displayChat: false });
};

const rollAbility = (roll, bonus) => {
  const abilityRoll = new Roll(roll).evaluate({
    async: false,
  });
  const ability = abilityBonus(abilityRoll.total);
  return bonus ? ability + parseInt(bonus, 10) : ability;
};

const findItems = async (items) => {
  const compendiumsItems = items.split("\n").filter((item) => item);
  const results = [];
  for (const compendiumsItem of compendiumsItems) {
    const [compendium, table] = compendiumInfoFromString(compendiumsItem);
    results.push(await findCompendiumItem(compendium, table));
  }
  return results;
};

export const findCompendiumItem = async (compendiumName, itemName) => {
  const compendium = game.packs.get(compendiumName);
  if (compendium) {
    const documents = await compendium.getDocuments();
    const item = documents.find((i) => i.name === itemName);
    if (!item) {
      console.warn(
        `findCompendiumItem: Could not find item (${itemName}) in compendium (${compendiumName})`
      );
    }
    return item;
  } else {
    console.warn(
      `findCompendiumItem: Could not find compendium (${compendiumName})`
    );
  }
};

export const drawTableItems = async (compendium, table, amount) => {
  let results = [];
  for (let i = 0; i < amount; i++) {
    results = results.concat(await drawTableItem(compendium, table));
  }
  return results;
};

export const drawTableItem = async (compendium, table) => {
  const draw = await drawTable(compendium, table);
  return await findTableItems(draw.results);
};

export const drawTableSingleTextResult = async (compendium, table) => {
  return (await drawTable(compendium, table)).results[0].getChatText();
};

export const rollTable = async (compendium, table, roll) => {
  const rollTable = await findCompendiumItem(compendium, table);
  const draw = await rollTable.roll(roll);
  return await findTableItems(draw.results);
};

export const rollName = async () => {
  const [compendium, table] = compendiumInfoFromString(
    PB.scvmFactory.namesPack
  );
  return await drawTableSingleTextResult(compendium, table);
};

export const rollAbilities = (data) => {
  return {
    strength: rollAbility(
      data.startingAbilityScoreFormula,
      data.startingStrengthBonus
    ),
    agility: rollAbility(
      data.startingAbilityScoreFormula,
      data.startingAgilityBonus
    ),
    presence: rollAbility(
      data.startingAbilityScoreFormula,
      data.startingPresenceBonus
    ),
    toughness: rollAbility(
      data.startingAbilityScoreFormula,
      data.startingToughnessBonus
    ),
    spirit: rollAbility(
      data.startingAbilityScoreFormula,
      data.startingSpiritBonus
    ),
  };
};

export const rollLuck = (luckDie) => {
  return new Roll(luckDie).evaluate({
    async: false,
  }).total;
};

export const rollHitPoints = (startingHitPoints, toughness) => {
  return (
    new Roll(startingHitPoints).evaluate({
      async: false,
    }).total + toughness
  );
};

export const rollSilver = (background) => {
  return new Roll(background.data.data.startingGold).evaluate({
    async: false,
  }).total;
};

export const rollArmor = async (roll) => {
  const [compendium, table] = compendiumInfoFromString(
    PB.scvmFactory.armorsRollTable
  );
  return await rollTable(compendium, table, roll);
};

export const rollHat = async (roll) => {
  const [compendium, table] = compendiumInfoFromString(
    PB.scvmFactory.hatsRollTable
  );
  return await rollTable(compendium, table, roll);
};

export const rollWeapon = async (roll) => {
  const [compendium, table] = compendiumInfoFromString(
    PB.scvmFactory.weaponsRollTable
  );
  return await rollTable(compendium, table, roll);
};

export const rollAncientRelics = async (roll) => {
  const [compendium, table] = compendiumInfoFromString(
    PB.scvmFactory.ancientRelicsRollTable
  );
  return await rollTable(compendium, table, roll);
};

export const rollArcaneRituals = async (roll) => {
  const [compendium, table] = compendiumInfoFromString(
    PB.scvmFactory.arcaneRitualsRollTable
  );
  return await rollTable(compendium, table, roll);
};

export const rollBaseTables = async () => {
  let items = [];
  for (const compendiumTable of PB.scvmFactory.baseTables) {
    const [compendium, table, quantity = 1] =
      compendiumInfoFromString(compendiumTable);
    items = items.concat(await drawTableItems(compendium, table, quantity));
  }
  return items;
};

export const rollRollItems = async (rolls) => {
  const compendiumTables = rolls.split("\n").filter((item) => item);
  let results = [];
  for (const compendiumTable of compendiumTables) {
    const [compendium, table, quantity = 1] =
      compendiumInfoFromString(compendiumTable);
    results = results.concat(await drawTableItems(compendium, table, quantity));
  }
  return results;
};

export const findFeatureBonusItems = async (features) => {
  let results = [];
  for (const feature of features) {
    if (feature.data.data.startingBonusItems) {
      results = results.concat(
        await findItems(feature.data.data.startingBonusItems)
      );
    }
  }
  return results;
};

export const handleClassGettingBetterRollTable = async (actor) => {
  const clazz = actor.items.find(
    (item) => item.type === CONFIG.PB.itemTypes.class
  );
  const [compendium, table] = compendiumInfoFromString(
    clazz.data.data.gettingBetterRolls
  );

  let items = [];
  if (compendium) {
    const compendiumRollTable = await findCompendiumItem(compendium, table);
    const rollTable = compendiumRollTable.clone({ replacement: false });

    while (true) {
      const draw = await rollTable.draw({ displayChat: false });
      items = await findTableItems(draw.results);
      console.log(items);

      if (!items.length) {
        break;
      }

      const item = items[0];
      const actorItem = actor.items.find((i) => i.data.name === item.data.name);
      const noLimits = item.data.data.maxQuantity === 0;
      const actorItemQuantity = actorItem
        ? actorItem.data.data.quantity || 1
        : 0;
      const itemMaxQuantity = item.data.data.maxQuantity || 1;

      if (noLimits || actorItemQuantity < itemMaxQuantity) {
        if (actorItem) {
          await actorItem.update({ ["data.quantity"]: actorItemQuantity + 1 });
        } else {
          await actor.createEmbeddedDocuments(
            "Item",
            items.map((item) => item.data)
          );
        }
        break;
      }
      draw.results.forEach((result) => (result.data.drawn = true));
    }
  }
  return items;
};

export const generateDescription = (clazz, items) => {
  const thingOfImportance = items.find(
    (item) => item.data.data.featureType === "Thing of Importance"
  );
  const description = items
    .filter(
      (item) =>
        item.type === CONFIG.PB.itemTypes.feature ||
        item.type === CONFIG.PB.itemTypes.background
    )
    .filter((item) => item.data.data.featureType !== "Thing of Importance")
    .map((doc) => doc.data.name)
    .concat([
      game.i18n.format("PB.YouOwn", {
        item: thingOfImportance.data.name,
      }),
    ])
    .join("...");

  return `<p>${clazz.data.data.flavorText}</p><p>${description}</p>`;
};

export const invokeStartingMacro = async (actor) => {
  const clazz = actor.items.find(
    (i) => i.data.type === CONFIG.PB.itemTypes.class
  );
  const [compendium, macroName] = compendiumInfoFromString(
    clazz.data.data.startingMacro
  );
  if (compendium && macroName) {
    const macro = await findCompendiumItem(compendium, macroName);
    executeMacro(macro, { actor, item: clazz });
  }
};

export const invokeGettingBetterMacro = async (actor) => {
  const clazz = actor.items.find(
    (i) => i.data.type === CONFIG.PB.itemTypes.class
  );
  const [compendium, macroName] = compendiumInfoFromString(
    clazz.data.data.gettingBetterMacro
  );
  if (compendium && macroName) {
    const macro = await findCompendiumItem(compendium, macroName);
    executeMacro(macro, { actor, item: clazz });
  }
};

export const rollScvmForClass = async (clazz) => {
  console.log(`Creating new ${clazz.data.name}`);

  const data = clazz.data.data;

  const name = await rollName();
  const abilities = rollAbilities(data);
  const luck = rollLuck(data.luckDie);
  const hitPoints = rollHitPoints(data.startingHitPoints, abilities.toughness);
  const baseTables = await rollBaseTables();

  const background = baseTables.find(
    (item) => item.type === CONFIG.PB.itemTypes.background
  );
  const features = baseTables.filter(
    (item) => item.type === CONFIG.PB.itemTypes.feature
  );
  const hasRelic = baseTables.some(
    (item) => item.data.data.invokableType === "Ancient Relic"
  );

  const silver = rollSilver(background);

  const armor = clazz.data.data.startingArmorTableFormula
    ? await rollArmor(
        !hasRelic ? clazz.data.data.startingArmorTableFormula : "1d6"
      )
    : [];
  const hat = clazz.data.data.startingHatTableFormula
    ? await rollHat(clazz.data.data.startingHatTableFormula)
    : [];
  const weapon = clazz.data.data.startingWeaponTableFormula
    ? await rollWeapon(clazz.data.data.startingWeaponTableFormula)
    : [];

  const startingRollItems = await rollRollItems(clazz.data.data.startingRolls);
  const startingItems = await findItems(clazz.data.data.startingItems);

  const backgroundBonusItems = await findItems(
    background.data.data.startingBonusItems
  );
  const featuresBonusItems = await findFeatureBonusItems([
    ...(features || []),
    ...(startingRollItems || []),
  ]);

  const description = generateDescription(clazz, baseTables);

  const allDocs = [
    ...baseTables,
    ...(armor || []),
    ...(hat || []),
    ...(weapon || []),
    ...(startingRollItems || []),
    ...(startingItems || []),
    ...(backgroundBonusItems || []),
    ...(featuresBonusItems || []),
    clazz,
  ];

  // power uses
  const powerUsesRoll = new Roll(`1d4 + ${abilities.spirit}`).evaluate({
    async: false,
  });
  const extraResourceRoll = new Roll(`1d4 + ${abilities.spirit}`).evaluate({
    async: false,
  });

  const items = allDocs.map((i) => ({
    data: i.data.data,
    img: i.data.img,
    name: i.data.name,
    type: i.data.type,
  }));

  return {
    name,
    actorImg: clazz.img,
    tokenImg: clazz.img,
    hitPoints,
    luck,
    ...abilities,
    items,
    description,
    silver,
    powerUses: powerUsesRoll.total,
    extraResourceUses: extraResourceRoll.total,
  };
};

const scvmToActorData = (s) => {
  return {
    name: s.name,
    data: {
      abilities: {
        strength: { value: s.strength },
        agility: { value: s.agility },
        presence: { value: s.presence },
        toughness: { value: s.toughness },
        spirit: { value: s.spirit },
      },
      description: s.description,
      hp: {
        max: s.hitPoints,
        value: s.hitPoints,
      },
      luck: {
        max: s.luck,
        value: s.luck,
      },
      powerUses: {
        max: s.powerUses,
        value: s.powerUses,
      },
      extraResourceUses: {
        max: s.extraResourceUses,
        value: s.extraResourceUses,
      },
      silver: s.silver,
    },
    img: s.actorImg,
    items: s.items,
    flags: {},
    token: {
      img: s.actorImg,
      name: s.name,
    },
    type: "character",
  };
};

const createActorWithScvm = async (s) => {
  const data = scvmToActorData(s);
  const actor = await PBActor.create(data);
  actor.sheet.render(true);
  await invokeStartingMacro(actor);
};

const updateActorWithScvm = async (actor, s) => {
  const data = scvmToActorData(s);
  await actor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
  await actor.update(data);
  for (const token of actor.getActiveTokens()) {
    await token.document.update({
      img: actor.data.img,
      name: actor.name,
    });
  }
  await invokeStartingMacro(actor);
};

export const findTableItems = async (results) => {
  const items = [];
  let item = null;
  for (const result of results) {
    if (result.data.type === 2) {
      item = await findCompendiumItem(result.data.collection, result.data.text);
      if (item) {
        items.push(item);
      }
    } else if (result.data.type === 0 && item) {
      const [property, value] = result.getChatText().split(": ");
      const enrichHtml = TextEditor.enrichHTML(value, {
        options: { command: true },
      });
      if (property === "description") {
        item.data.data.description = enrichHtml;
      } else if (property === "quantity") {
        item.data.data.quantity = parseInt(
          $(`<span>${enrichHtml}</span>`).text().trim(),
          10
        );
      }
    }
  }
  return items;
};

const abilityBonus = (rollTotal) => {
  if (rollTotal <= 4) {
    return -3;
  } else if (rollTotal <= 6) {
    return -2;
  } else if (rollTotal <= 8) {
    return -1;
  } else if (rollTotal <= 12) {
    return 0;
  } else if (rollTotal <= 14) {
    return 1;
  } else if (rollTotal <= 16) {
    return 2;
  } else {
    // 17 - 20+
    return 3;
  }
};
