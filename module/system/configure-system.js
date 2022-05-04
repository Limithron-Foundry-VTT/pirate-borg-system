import { PBActor } from "../actor/actor.js";
import { PBActorSheetCharacter } from "../actor/sheet/character-sheet.js";
import { PBActorSheetContainer } from "../actor/sheet/container-sheet.js";
import { PBActorSheetCreature } from "../actor/sheet/creature-sheet.js";
import { PBCombat } from "../combat.js";
import { PB } from "../config.js";
import { PBItem } from "../item/item.js";
import { PBItemSheet } from "../item/sheet/item-sheet.js";
import { createPirateBorgMacro, rollItemMacro } from "../macros.js";
import * as pirateFactory from "../scvm/scvmfactory.js";
import * as macroHelpers from "../macro-helpers.js";

export const configureSystem = () => {
  game.pirateborg = {
    config: PB,
    createPirateBorgMacro,
    PBActor,
    PBItem,
    rollItemMacro,
    pirateFactory,
    macroHelpers,
  };

  CONFIG.Actor.documentClass = PBActor;
  CONFIG.Combat.documentClass = PBCombat;

  CONFIG.Combat.initiative = {
    formula: "1d6 + @abilities.agility.value",
  };

  CONFIG.Item.documentClass = PBItem;
  CONFIG.PB = PB;

  Actors.unregisterSheet("core", ActorSheet);

  Actors.registerSheet("pirateborg", PBActorSheetCharacter, {
    types: ["character"],
    makeDefault: true,
    label: "PB.SheetClassCharacter",
  });

  Actors.registerSheet("pirateborg", PBActorSheetContainer, {
    types: ["container"],
    makeDefault: true,
    label: "PB.SheetClassContainer",
  });

  Actors.registerSheet("pirateborg", PBActorSheetCreature, {
    types: ["creature"],
    makeDefault: true,
    label: "PB.SheetClassCreature",
  });

  Items.unregisterSheet("core", ItemSheet);

  Items.registerSheet("pirateborg", PBItemSheet, {
    makeDefault: true,
    label: "PB.SheetItem",
  });
};
