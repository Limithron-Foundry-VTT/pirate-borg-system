/** @name CONFIG.PB */
export const PB = {};

PB.flagScope = "pirateborg"; // must match system name

PB.flags = {
  ATTACK_DR: "attackDR",
  DEFEND_DR: "defendDR",
  DEFEND_ARMOR: "defendArmor",
  INCOMING_ATTACK: "incomingAttack",
  TARGET_ARMOR: "targetArmor",
  SELECTED_CREW: "selectedCrew",
  OUTCOMES: "outcomes",
  TARGET_TOKEN: "targetToken",
  INITIATOR_TOKEN: "initiatorToken",
  PARTY_INITIATIVE: "partyInitiative",
  ANIMATION: "itemAnimation",
};

PB.scrollingTextFont = "IM Fell English SC";

PB.ability = {
  agility: "agility",
  presence: "presence",
  strength: "strength",
  toughness: "toughness",
  spirit: "spirit",
  skill: "skill",
};

PB.abilityKey = {
  [PB.ability.agility]: "PB.AbilityAgility",
  [PB.ability.presence]: "PB.AbilityPresence",
  [PB.ability.strength]: "PB.AbilityStrength",
  [PB.ability.toughness]: "PB.AbilityToughness",
  [PB.ability.spirit]: "PB.AbilitySpirit",
  [PB.ability.skill]: "PB.AbilitySkill",
};

PB.armorTiers = {
  0: {
    key: "PB.ArmorTierNone",
    damageReductionDie: "0",
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
  vehicle_npc: "vehicle_npc",
};

PB.itemTypes = {
  ammo: "ammo",
  armor: "armor",
  background: "background",
  class: "class",
  container: "container",
  grog: "grog",
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
  [PB.itemTypes.grog]: "PB.ItemTypeGrog",
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
    img: "systems/pirateborg/tokens/class.png",
    prototypeToken: {
      actorLink: true,
      disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      sight: { enabled: true },
    },
  },
  [PB.actorTypes.container]: {
    img: "systems/pirateborg/icons/misc/container.png",
    prototypeToken: {
      actorLink: false,
      disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
      sight: { enabled: false },
    },
  },
  [PB.actorTypes.creature]: {
    img: "systems/pirateborg/icons/misc/monster.png",
    prototypeToken: {
      actorLink: false,
      disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      sight: { enabled: false },
    },
  },
  [PB.actorTypes.vehicle]: {
    img: "systems/pirateborg/icons/misc/ship.png",
    prototypeToken: {
      actorLink: true,
      disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
      sight: { enabled: true },
    },
  },
  [PB.actorTypes.vehicle_npc]: {
    img: "systems/pirateborg/icons/misc/ship.png",
    prototypeToken: {
      actorLink: false,
      disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
      sight: { enabled: false },
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
  [PB.itemTypes.grog]: {
    img: "systems/pirateborg/icons/classes/rapscallion/beer-stein.png",
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

PB.itemEquipmentTypes = [
  PB.itemTypes.ammo,
  PB.itemTypes.armor,
  PB.itemTypes.container,
  PB.itemTypes.grog,
  PB.itemTypes.misc,
  PB.itemTypes.invokable,
  PB.itemTypes.hat,
  PB.itemTypes.weapon,
];

PB.allowedContainerItemTypes = [
  PB.itemTypes.ammo,
  PB.itemTypes.armor,
  PB.itemTypes.grog,
  PB.itemTypes.misc,
  PB.itemTypes.invokable,
  PB.itemTypes.hat,
  PB.itemTypes.weapon,
];

PB.equippableItemTypes = [PB.itemTypes.armor, PB.itemTypes.hat, PB.itemTypes.weapon];

PB.droppableItemTypes = [PB.itemTypes.container];

PB.plusMinusItemTypes = [PB.itemTypes.ammo, PB.itemTypes.grog, PB.itemTypes.misc, PB.itemTypes.feature];

PB.weaponTypes = {
  melee: "PB.WeaponTypeMelee",
  ranged: "PB.WeaponTypeRanged",
  thrown: "PB.WeaponTypeThrown",
};

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
    "pirateborg.rolls-character-creation;d20 Physical Trademark",
    "pirateborg.rolls-character-creation;d20 Idiosyncrasies",
    "pirateborg.rolls-character-creation;d20 Unfortunate Incidents & Conditions",
    "pirateborg.rolls-character-creation;d100 Thing of Importance",
  ],
};

/**
 * Status effects configuration for Pirate Borg.
 * Icons from game-icons.net by Lorc, Delapouite, and others (CC BY 3.0).
 */
PB.systemEffects = {
  dead: {
    id: "dead",
    name: "PB.StatusDead",
    img: "systems/pirateborg/icons/status/pirate-grave.svg",
  },
  unconscious: {
    id: "unconscious",
    name: "PB.StatusUnconscious",
    img: "systems/pirateborg/icons/status/coma.svg",
  },
  sleep: {
    id: "sleep",
    name: "PB.StatusAsleep",
    img: "systems/pirateborg/icons/status/sleep.svg",
  },
  stun: {
    id: "stun",
    name: "PB.StatusStunned",
    img: "systems/pirateborg/icons/status/knocked-out-stars.svg",
  },
  prone: {
    id: "prone",
    name: "PB.StatusProne",
    img: "systems/pirateborg/icons/status/kneeling.svg",
  },
  restrained: {
    id: "restrained",
    name: "PB.StatusRestrained",
    img: "systems/pirateborg/icons/status/restrained.svg",
  },
  paralysis: {
    id: "paralysis",
    name: "PB.StatusParalyzed",
    img: "systems/pirateborg/icons/status/paralyzed.svg",
  },
  blind: {
    id: "blind",
    name: "PB.StatusBlind",
    img: "systems/pirateborg/icons/status/blindfold.svg",
  },
  deaf: {
    id: "deaf",
    name: "PB.StatusDeaf",
    img: "systems/pirateborg/icons/status/deaf.svg",
  },
  silence: {
    id: "silence",
    name: "PB.StatusSilenced",
    img: "systems/pirateborg/icons/status/silence.svg",
  },
  fear: {
    id: "fear",
    name: "PB.StatusFrightened",
    img: "systems/pirateborg/icons/status/screaming.svg",
  },
  burning: {
    id: "burning",
    name: "PB.StatusBurning",
    img: "systems/pirateborg/icons/status/flame.svg",
  },
  frozen: {
    id: "frozen",
    name: "PB.StatusFrozen",
    img: "systems/pirateborg/icons/status/frozen-block.svg",
  },
  poison: {
    id: "poison",
    name: "PB.StatusPoisoned",
    img: "systems/pirateborg/icons/status/poison.svg",
  },
  disease: {
    id: "disease",
    name: "PB.StatusDiseased",
    img: "systems/pirateborg/icons/status/disease.svg",
  },
  invisible: {
    id: "invisible",
    name: "PB.StatusInvisible",
    img: "systems/pirateborg/icons/status/invisible.svg",
  },
  target: {
    id: "target",
    name: "PB.StatusTargeted",
    img: "systems/pirateborg/icons/status/crosshair.svg",
  },
  // Pirate Borg-specific effects
  intoxicated: {
    id: "intoxicated",
    name: "PB.StatusIntoxicated",
    img: "systems/pirateborg/icons/status/beer-stein.svg",
  },
  vomiting: {
    id: "vomiting",
    name: "PB.GrogVomiting",
    img: "systems/pirateborg/icons/status/seasick.svg",
  },
  infected: {
    id: "infected",
    name: "PB.StatusInfected",
    img: "systems/pirateborg/icons/status/infected.svg",
  },
  starving: {
    id: "starving",
    name: "PB.StatusStarving",
    img: "systems/pirateborg/icons/status/starving.svg",
  },
  broken: {
    id: "broken",
    name: "PB.StatusBroken",
    img: "systems/pirateborg/icons/status/broken-skull.svg",
  },
  encumbered: {
    id: "encumbered",
    name: "PB.StatusEncumbered",
    img: "systems/pirateborg/icons/status/anchor.svg",
  },
  seasick: {
    id: "seasick",
    name: "PB.StatusSeasick",
    img: "systems/pirateborg/icons/status/seasick.svg",
  },
  cursed: {
    id: "cursed",
    name: "PB.StatusCursed",
    img: "systems/pirateborg/icons/status/cursed.svg",
  },
  blessed: {
    id: "blessed",
    name: "PB.StatusBlessed",
    img: "systems/pirateborg/icons/status/prayer.svg",
  },
  slowed: {
    id: "slowed",
    name: "PB.StatusSlowed",
    img: "systems/pirateborg/icons/status/slowed.svg",
  },
  drowning: {
    id: "drowning",
    name: "PB.StatusDrowning",
    img: "systems/pirateborg/icons/status/drowning.svg",
  },
  swimming: {
    id: "swimming",
    name: "PB.StatusSwimming",
    img: "systems/pirateborg/icons/status/swimming.svg",
  },
  rigging: {
    id: "rigging",
    name: "PB.StatusInRigging",
    img: "systems/pirateborg/icons/status/rigging.svg",
  },
  treasure: {
    id: "treasure",
    name: "PB.StatusCarryingTreasure",
    img: "systems/pirateborg/icons/status/treasure.svg",
  },
};

/**
 * Colored markers for arbitrary token marking.
 */
PB.coloredMarkers = {
  markerRed: {
    id: "markerRed",
    name: "PB.MarkerRed",
    img: "systems/pirateborg/icons/markers/red.svg",
  },
  markerOrange: {
    id: "markerOrange",
    name: "PB.MarkerOrange",
    img: "systems/pirateborg/icons/markers/orange.svg",
  },
  markerYellow: {
    id: "markerYellow",
    name: "PB.MarkerYellow",
    img: "systems/pirateborg/icons/markers/yellow.svg",
  },
  markerGreen: {
    id: "markerGreen",
    name: "PB.MarkerGreen",
    img: "systems/pirateborg/icons/markers/green.svg",
  },
  markerBlue: {
    id: "markerBlue",
    name: "PB.MarkerBlue",
    img: "systems/pirateborg/icons/markers/blue.svg",
  },
  markerPurple: {
    id: "markerPurple",
    name: "PB.MarkerPurple",
    img: "systems/pirateborg/icons/markers/purple.svg",
  },
  markerCyan: {
    id: "markerCyan",
    name: "PB.MarkerCyan",
    img: "systems/pirateborg/icons/markers/cyan.svg",
  },
  markerPink: {
    id: "markerPink",
    name: "PB.MarkerPink",
    img: "systems/pirateborg/icons/markers/pink.svg",
  },
  markerBrown: {
    id: "markerBrown",
    name: "PB.MarkerBrown",
    img: "systems/pirateborg/icons/markers/brown.svg",
  },
  markerWhite: {
    id: "markerWhite",
    name: "PB.MarkerWhite",
    img: "systems/pirateborg/icons/markers/white.svg",
  },
  markerBlack: {
    id: "markerBlack",
    name: "PB.MarkerBlack",
    img: "systems/pirateborg/icons/markers/black.svg",
  },
  markerGray: {
    id: "markerGray",
    name: "PB.MarkerGray",
    img: "systems/pirateborg/icons/markers/gray.svg",
  },
};

PB.recommendedModules = [
  {
    type: "highly_recommended",
    name: "Sequencer",
    package: "sequencer",
    url: "https://foundryvtt.com/packages/sequencer",
    description: "Required for advanced animations.",
  },
  {
    type: "highly_recommended",
    name: "JB2A - Jules&Ben's Animated Assets",
    package: "JB2A_DnD5e",
    url: "https://foundryvtt.com/packages/JB2A_DnD5e",
    description: "Required for advanced animations.",
  },
  {
    type: "must_have",
    name: "Drag Ruler",
    package: "drag-ruler",
    url: "https://foundryvtt.com/packages/drag-ruler",
    description: "This module shows a ruler when you drag a token or measurement template to inform you how far you've dragged it from its start point.",
    compatibility: {
      max: 12,
    },
  },
  {
    type: "must_have",
    name: "Dice So Nice!",
    package: "dice-so-nice",
    url: "https://foundryvtt.com/packages/dice-so-nice",
    description: "This module for Foundry VTT adds the ability to show a 3D dice simulation when a roll is made.",
  },
  {
    type: "must_have",
    name: "Dice Tray",
    package: "dice-calculator",
    url: "https://foundryvtt.com/packages/dice-calculator",
    description: "This module adds a dice tray below the chat message area.",
  },
  {
    type: "recommended",
    name: "Always HP",
    package: "always-hp",
    url: "https://foundryvtt.com/packages/always-hp",
    description: "This module will show a moveable window that can adjust the HP of the currently selected tokens.",
  },
  {
    type: "recommended",
    name: "FXMaster",
    package: "fxmaster",
    url: "https://foundryvtt.com/packages/fxmaster",
    description: "FXMaster provides various types of weather & filter effects.",
  },
  {
    type: "recommended",
    name: "Splatter",
    package: "splatter",
    url: "https://foundryvtt.com/packages/splatter",
    description: "Add blood and gore to your games.",
  },
];

CONFIG.PB = PB;
