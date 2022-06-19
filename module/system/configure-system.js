import { PBActor } from "../actor/actor.js";
import { PBActorSheetCharacter } from "../actor/sheet/character-sheet.js";
import { PBActorSheetContainer } from "../actor/sheet/container-sheet.js";
import { PBActorSheetCreature } from "../actor/sheet/creature-sheet.js";
import { PBCombat } from "./combat.js";
import { PB } from "../config.js";
import { PBItem } from "../item/item.js";
import { PBItemSheet } from "../item/sheet/item-sheet.js";
import * as characterGenerator from "../api/generator/character-generator.js";
import * as macros from "../api/macros.js";
import * as utils from "../api/utils.js";
import * as compendium from "../api/compendium.js";
import * as actions from "../api/action/actions.js";
import * as animations from "../api/animation/animation.js";
import * as advancedAnimations from "../api/animation/advanced-animation.js";
import * as outcomeAnimations from "../api/animation/outcome-animation.js";
import { PBActorSheetVehicleEdit } from "../actor/sheet/vehicle-edit-sheet.js";
import { PBActorSheetVehicle } from "../actor/sheet/vehicle-sheet.js";
import { showGenericCard } from "../chat-message/generic-card.js";

export const configureSystem = () => {
  game.pirateborg = {
    config: PB,
    PBActor,
    PBItem,
    api: {
      actions,
      compendium,
      utils,      
      animations,
      advancedAnimations,
      outcomeAnimations,
      characterGenerator,
      showGenericCard,
      macros
    },
  };

  CONFIG.Actor.documentClass = PBActor;
  CONFIG.Combat.documentClass = PBCombat;
  CONFIG.Item.documentClass = PBItem;

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

  Actors.registerSheet("pirateborg", PBActorSheetVehicle, {
    types: ["vehicle", "vehicle_npc"],
    makeDefault: true,
    label: "PB.SheetClassVehicle",
  });

  Actors.registerSheet("pirateborg", PBActorSheetVehicleEdit, {
    types: ["vehicle", "vehicle_npc"],
    label: "PB.SheetClassVehicleEdit",
  });

  Items.unregisterSheet("core", ItemSheet);

  Items.registerSheet("pirateborg", PBItemSheet, {
    makeDefault: true,
    label: "PB.SheetItem",
  });

  CONFIG.Combat.initiative = {
    formula: "1d6 + @abilities.agility.value",
  };
};
