// Namespace Configuration Values
export const PB = {};

PB.outcome = {
  fumble: "fumble",
  success: "success",
  critical_success: "critical_success",
  failure: "failure",
};

PB.abilities = {
  agility: "PB.AbilityAgility",
  presence: "PB.AbilityPresence",
  strength: "PB.AbilityStrength",
  toughness: "PB.AbilityToughness",
  spirit: "PB.AbilitySpirit",
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

PB.flagScope = "pirateborg"; // must match system name

PB.flags = {
  ATTACK_DR: "attackDR",
  DEFEND_DR: "defendDR",
  INCOMING_ATTACK: "incomingAttack",
  TARGET_ARMOR: "targetArmor",
  SELECTED_CREW: "selectedCrew",
};

PB.premiumModuleName = "pirateborg";

PB.handed = {
  1: "PB.HandedOne",
  2: "PB.HandedTwo",
};

PB.actorTypes = {
  character: "character",
  container: "container",
  creature: "creature",
  vehicle: "vehicle",
  vehicle_creature: "vehicle_creature",
};

PB.itemTypes = {
  ammo: "ammo",
  armor: "armor",
  background: "background",
  class: "class",
  container: "container",
  feature: "feature",
  hat: "hat",
  invokable: "invokable",
  misc: "misc",
  weapon: "weapon",
  cargo: "cargo",
  shanty: "shanty",
};

PB.itemTypeKeys = {
  [PB.itemTypes.ammo]: "PB.ItemTypeAmmo",
  [PB.itemTypes.armor]: "PB.ItemTypeArmor",
  [PB.itemTypes.background]: "PB.ItemTypeBackground",
  [PB.itemTypes.class]: "PB.ItemTypeClass",
  [PB.itemTypes.container]: "PB.ItemTypeContainer",
  [PB.itemTypes.feature]: "PB.ItemTypeFeature",
  [PB.itemTypes.hat]: "PB.ItemTypeHat",
  [PB.itemTypes.invokable]: "PB.ItemTypeInvokable",
  [PB.itemTypes.misc]: "PB.ItemTypeMisc",
  [PB.itemTypes.weapon]: "PB.ItemTypeWeapon",
  [PB.itemTypes.cargo]: "PB.ItemTypeCargo",
  [PB.itemTypes.shanty]: "PB.ItemTypeShanty",
};

PB.actorDefaults = {
  [PB.actorTypes.character]: {
    img: "systems/pirateborg/icons/misc/class.png",
    token: {
      actorLink: true,
      disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      vision: true,
      displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
      displayName: CONST.TOKEN_DISPLAY_MODES.OWNER,
    },
  },
  [PB.actorTypes.container]: {
    img: "systems/pirateborg/icons/misc/container.png",
    token: {
      actorLink: false,
      disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
      vision: false,
    },
  },
  [PB.actorTypes.creature]: {
    img: "systems/pirateborg/icons/misc/monster.png",
    token: {
      actorLink: false,
      disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      vision: false,
    },
  },
  [PB.actorTypes.vehicle]: {
    img: "systems/pirateborg/icons/misc/ship.png",
    token: {
      actorLink: true,
      disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      vision: true,
      displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
      displayName: CONST.TOKEN_DISPLAY_MODES.OWNER,
    },
  },
  [PB.actorTypes.vehicle_creature]: {
    img: "systems/pirateborg/icons/misc/ship.png",
    token: {
      actorLink: false,
      disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      vision: false,
    },
  },
};

PB.itemDefaultImage = {
  [PB.itemTypes.ammo]: {
    img: "systems/pirateborg/icons/misc/ammo.png",
  },
  [PB.itemTypes.armor]: {
    img: "systems/pirateborg/icons/misc/armor.png",
  },
  [PB.itemTypes.background]: {
    img: "systems/pirateborg/icons/misc/background.png",
  },
  [PB.itemTypes.class]: {
    img: "systems/pirateborg/icons/misc/class.png",
  },
  [PB.itemTypes.container]: {
    img: "systems/pirateborg/icons/misc/container.png",
  },
  [PB.itemTypes.feature]: {
    img: "systems/pirateborg/icons/misc/class-feature.png",
  },
  [PB.itemTypes.hat]: {
    img: "systems/pirateborg/icons/misc/hat.png",
  },
  [PB.itemTypes.invokable]: {
    img: "systems/pirateborg/icons/misc/invokable.png",
  },
  [PB.itemTypes.misc]: {
    img: "systems/pirateborg/icons/misc/misc.png",
  },
  [PB.itemTypes.weapon]: {
    img: "systems/pirateborg/icons/misc/weapon.png",
  },
  [PB.itemTypes.cargo]: {
    img: "systems/pirateborg/icons/misc/cargo.png",
  },
  [PB.itemTypes.shanty]: {
    img: "systems/pirateborg/icons/misc/shanty.png",
  },
};

// these Item types are "equipment"
PB.itemEquipmentTypes = [
  PB.itemTypes.ammo,
  PB.itemTypes.armor,
  PB.itemTypes.container,
  PB.itemTypes.misc,
  PB.itemTypes.invokable,
  PB.itemTypes.hat,
  PB.itemTypes.weapon,
];

PB.allowedContainerItemTypes = [PB.itemTypes.ammo, PB.itemTypes.armor, PB.itemTypes.misc, PB.itemTypes.invokable, PB.itemTypes.hat, PB.itemTypes.weapon];

PB.equippableItemTypes = [PB.itemTypes.armor, PB.itemTypes.hat, PB.itemTypes.weapon];

PB.droppableItemTypes = [PB.itemTypes.container];

PB.plusMinusItemTypes = [PB.itemTypes.ammo, PB.itemTypes.misc, PB.itemTypes.feature];

PB.weaponTypes = {
  melee: "PB.WeaponTypeMelee",
  ranged: "PB.WeaponTypeRanged",
};

// Config variables for the character generator
PB.characterGenerator = {
  characterCreationPack: "pirateborg.rolls-character-creation",

  firstNamesPack: "pirateborg.rolls-character-creation;First Names",
  nickNamesPack: "pirateborg.rolls-character-creation;Nicknames",
  lastNamesPack: "pirateborg.rolls-character-creation;Last Names",

  armorsRollTable: "pirateborg.rolls-character-creation;d10 Starting clothing & armor",
  weaponsRollTable: "pirateborg.rolls-character-creation;d10 Starting weapons",
  hatsRollTable: "pirateborg.rolls-character-creation;d12 Starting hats",
  arcaneRitualsRollTable: "pirateborg.rolls-character-creation;d20 Arcane rituals",
  ancientRelicsRollTable: "pirateborg.rolls-character-creation;d20 Ancient relics",

  // compendium;table;amount
  baseTables: [
    "pirateborg.rolls-character-creation;d100 Backgrounds",
    "pirateborg.rolls-character-creation;d6 Container",
    "pirateborg.rolls-character-creation;d12 Cheap gear",
    "pirateborg.rolls-character-creation;d12 Fancy gear",
    "pirateborg.rolls-character-creation;d20 Distinctive Flaws",
    "pirateborg.rolls-character-creation;d20 Physical Ailments",
    "pirateborg.rolls-character-creation;d20 Idiosyncrasies",
    "pirateborg.rolls-character-creation;d20 Unfortunate Incidents & Conditions",
    "pirateborg.rolls-character-creation;d100 Thing of Importance",
  ],
};
