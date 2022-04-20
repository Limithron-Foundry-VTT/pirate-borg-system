// Namespace Configuration Values
export const PB = {};

PB.abilities = {
  agility: "PB.AbilityAgility",
  presence: "PB.AbilityPresence",
  strength: "PB.AbilityStrength",
  toughness: "PB.AbilityToughness",
};

PB.armorTiers = {
  0: {
    key: "PB.ArmorTierNone",
    damageReductionDie: "1d0",
    agilityModifier: 0,
    defenseModifier: 0,
  },
  1: {
    key: "PB.ArmorTierLight",
    damageReductionDie: "1d2",
    agilityModifier: 0,
    defenseModifier: 0,
  },
  2: {
    key: "PB.ArmorTierMedium",
    damageReductionDie: "1d4",
    agilityModifier: 2,
    defenseModifier: 2,
  },
  3: {
    key: "PB.ArmorTierHeavy",
    damageReductionDie: "1d6",
    agilityModifier: 4,
    defenseModifier: 2,
  },
};

PB.colorSchemes = {
  blackOnYellowWhite: {
    background: "#ffe900",
    foreground: "#000000",
    foregroundAlt: "#808080",
    highlightBackground: "#ffffff",
    highlightForeground: "#000000",
    sidebarBackground: "#ffe900",
    sidebarForeground: "000000",
    sidebarButtonBackground: "#000000",
    sidebarButtonForeground: "#ffe900",
    windowBackground: "#ffe900",
  },
  blackOnWhiteBlack: {
    background: "#ffffff",
    foreground: "#000000",
    foregroundAlt: "#808080",
    highlightBackground: "#000000",
    highlightForeground: "#ffffff",
    sidebarBackground: "#ffffff",
    sidebarForeground: "#000000",
    sidebarButtonBackground: "#000000",
    sidebarButtonForeground: "#ffffff",
    windowBackground: "#ffffff",
  },
  foundryDefault: {
    background: "#f0f0e0",
    foreground: "#191813",
    foregroundAlt: "red",
    highlightBackground: "#191813",
    highlightForeground: "#f0f0e0",
    sidebarBackground: "url(../ui/denim.jpg) repeat",
    sidebarForeground: "#f0f0e0",
    sidebarButtonBackground: "#f0f0e0",
    sidebarButtonForeground: "#000000",
    windowBackground: "url(../ui/parchment.jpg) repeat",
  },
  whiteOnBlackYellow: {
    background: "#000000",
    foreground: "#ffffff",
    foregroundAlt: "#ffe900",
    highlightBackground: "#ffe900",
    highlightForeground: "#000000",
    sidebarBackground: "#000000",
    sidebarForeground: "#ffffff",
    sidebarButtonBackground: "#ffffff",
    sidebarButtonForeground: "#000000",
    windowBackground: "#000000",
  },
  whiteOnBlackPink: {
    background: "#000000",
    foreground: "#ffffff",
    foregroundAlt: "#ff3eb5",
    highlightBackground: "#ff3eb5",
    highlightForeground: "#000000",
    sidebarBackground: "#000000",
    sidebarForeground: "#ffffff",
    sidebarButtonBackground: "#ffffff",
    sidebarButtonForeground: "#000000",
    windowBackground: "#000000",
  },
  whiteOnPinkWhite: {
    background: "#ff3eb5",
    foreground: "#ffffff",
    foregroundAlt: "#000000",
    highlightBackground: "#ffffff",
    highlightForeground: "#000000",
    sidebarBackground: "#ff3eb5",
    sidebarForeground: "#ffffff",
    sidebarButtonBackground: "#ffffff",
    sidebarButtonForeground: "#ff3eb5",
    windowBackground: "#ff3eb5",
  },
};

PB.flagScope = "pirateborg"; // must match system name

PB.flags = {
  ATTACK_DR: "attackDR",
  DEFEND_DR: "defendDR",
  INCOMING_ATTACK: "incomingAttack",
  TARGET_ARMOR: "targetArmor",
};

PB.fontSchemes = {
  blackletter: {
    chat: "Alegreya",
    chatInfo: "Oswald",
    h1: "Blood Crow",
    h2: "FetteTrumpDeutsch",
    h3: "Old Cupboard",
    item: "Special Elite",
  },
  legible: {
    chat: "Alegreya",
    chatInfo: "Oswald",
    h1: "Blood Crow",
    h2: "Calling Code Regular",
    h3: "Old Cupboard",
    item: "Lato",
  },
};

PB.handed = {
  1: "PB.HandedOne",
  2: "PB.HandedTwo",
};

PB.ammoTypes = {
  arrow: "PB.AmmoTypeArrow",
  bolt: "PB.AmmoTypeBolt",
  slingstone: "PB.AmmoTypeSlingstone",
};

PB.itemTypes = {
  ammo: "ammo",
  armor: "armor",
  class: "class",
  container: "container",
  feat: "feat",
  misc: "misc",
  scroll: "scroll",
  shield: "shield",
  weapon: "weapon",
};

PB.itemTypeKeys = {
  ammo: "PB.ItemTypeAmmo",
  armor: "PB.ItemTypeArmor",
  class: "PB.ItemTypeClass",
  container: "PB.ItemTypeContainer",
  feat: "PB.ItemTypeFeat",
  misc: "PB.ItemTypeMisc",
  scroll: "PB.ItemTypeScroll",
  shield: "PB.ItemTypeShield",
  weapon: "PB.ItemTypeWeapon",
};

// these Item types are "equipment"
PB.itemEquipmentTypes = [
  PB.itemTypes.ammo,
  PB.itemTypes.armor,
  PB.itemTypes.container,
  PB.itemTypes.misc,
  PB.itemTypes.scroll,
  PB.itemTypes.shield,
  PB.itemTypes.weapon,
];

PB.allowedContainerItemTypes = [
  PB.itemTypes.ammo,
  PB.itemTypes.armor,
  PB.itemTypes.misc,
  PB.itemTypes.scroll,
  PB.itemTypes.shield,
  PB.itemTypes.weapon,
];

PB.equippableItemTypes = [
  PB.itemTypes.armor,
  PB.itemTypes.shield,
  PB.itemTypes.weapon,
];

PB.droppableItemTypes = [PB.itemTypes.container];

PB.plusMinusItemTypes = [PB.itemTypes.ammo, PB.itemTypes.misc];

PB.scrollTypes = {
  sacred: "PB.ScrollTypeSacred",
  tablet: "PB.ScrollTypeTablet",
  unclean: "PB.ScrollTypeUnclean",
};

PB.weaponTypes = {
  melee: "PB.WeaponTypeMelee",
  ranged: "PB.WeaponTypeRanged",
};

// Config variables for the Scvmfactory character generator
PB.scvmFactory = {
  foodAndWaterPack: "pirateborg.equipment-misc",
  foodItemName: "Dried food",
  waterItemName: "Waterskin",

  characterCreationPack: "pirateborg.character-creation",
  startingEquipmentTable1: "Starting Equipment (1)",
  startingEquipmentTable2: "Starting Equipment (2)",
  startingEquipmentTable3: "Starting Equipment (3)",
  startingWeaponTable: "Starting Weapon",
  weaponDieIfRolledScroll: "1d6",
  startingArmorTable: "Starting Armor",
  armorDieIfRolledScroll: "1d2",
  terribleTraitsTable: "Terribler Traits",
  brokenBodiesTable: "Brokener Bodies",
  badHabitsTable: "Badder Habits",
};
