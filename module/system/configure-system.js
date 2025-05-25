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
import * as outcomes from "../api/outcome/outcome.js";
import { PBActorSheetVehicleEdit } from "../actor/sheet/vehicle-edit-sheet.js";
import { PBActorSheetVehicle } from "../actor/sheet/vehicle-sheet.js";
import { showGenericCard } from "../chat-message/generic-card.js";
import { registerTokenRuler } from "./token-ruler.js";

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
      outcomes,
      macros,
    },
  };

  CONFIG.Actor.documentClass = PBActor;
  CONFIG.Item.documentClass = PBItem;

  if (game.release.generation >= 13) {
    foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  } else {
    Actors.unregisterSheet("core", ActorSheet);
  }

  if (game.release.generation >= 13) {
    foundry.documents.collections.Actors.registerSheet("pirateborg", PBActorSheetCharacter, {
      types: ["character"],
      makeDefault: true,
      label: "PB.SheetClassCharacter",
    });
  } else {
    Actors.registerSheet("pirateborg", PBActorSheetCharacter, {
      types: ["character"],
      makeDefault: true,
      label: "PB.SheetClassCharacter",
    });
  }

  if (game.release.generation >= 13) {
    foundry.documents.collections.Actors.registerSheet("pirateborg", PBActorSheetContainer, {
      types: ["container"],
      makeDefault: true,
      label: "PB.SheetClassContainer",
    });
  } else {
    Actors.registerSheet("pirateborg", PBActorSheetContainer, {
      types: ["container"],
      makeDefault: true,
      label: "PB.SheetClassContainer",
    });
  }

  if (game.release.generation >= 13) {
    foundry.documents.collections.Actors.registerSheet("pirateborg", PBActorSheetCreature, {
      types: ["creature"],
      makeDefault: true,
      label: "PB.SheetClassCreature",
    });
  } else {
    Actors.registerSheet("pirateborg", PBActorSheetCreature, {
      types: ["creature"],
      makeDefault: true,
      label: "PB.SheetClassCreature",
    });
  }

  if (game.release.generation >= 13) {
    foundry.documents.collections.Actors.registerSheet("pirateborg", PBActorSheetVehicle, {
      types: ["vehicle", "vehicle_npc"],
      makeDefault: true,
      label: "PB.SheetClassVehicle",
    });
  } else {
    Actors.registerSheet("pirateborg", PBActorSheetVehicle, {
      types: ["vehicle", "vehicle_npc"],
      makeDefault: true,
      label: "PB.SheetClassVehicle",
    });
  }

  if (game.release.generation >= 13) {
    foundry.documents.collections.Actors.registerSheet("pirateborg", PBActorSheetVehicleEdit, {
      types: ["vehicle", "vehicle_npc"],
      label: "PB.SheetClassVehicleEdit",
    });
  } else {
    Actors.registerSheet("pirateborg", PBActorSheetVehicleEdit, {
      types: ["vehicle", "vehicle_npc"],
      label: "PB.SheetClassVehicleEdit",
    });
  }

  if (game.release.generation >= 13) {
    foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  } else {
    Items.unregisterSheet("core", ItemSheet);
  }

  if (game.release.generation >= 13) {
    foundry.documents.collections.Items.registerSheet("pirateborg", PBItemSheet, {
      makeDefault: true,
      label: "PB.SheetItem",
    });
  } else {
    Items.registerSheet("pirateborg", PBItemSheet, {
      makeDefault: true,
      label: "PB.SheetItem",
    });
  }

  CONFIG.Combat.documentClass = PBCombat;
  CONFIG.Combat.initiative = {
    formula: "1d6 + @abilities.agility.value",
  };

  for (const styleFormat of CONFIG.TinyMCE.style_formats) {
    if (styleFormat.title !== "Custom") continue;
    styleFormat.items.push({
      inline: "span",
      classes: "pb-highlight",
      title: "Highlight Text",
      wrapper: true,
    });
  }
  if (!(CONFIG.TinyMCE.content_css instanceof Array)) {
    CONFIG.TinyMCE.content_css = [CONFIG.TinyMCE.content_css];
  }
  CONFIG.TinyMCE.content_css.push("systems/pirateborg/css/editor.css");

  registerTokenRuler();
};
