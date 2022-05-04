/**
 * Pirate Borg module.
 */
import { createPirateBorgMacro } from "./macros.js";
import { migrate } from "./migrate.js";
import { configureHandlebar } from "./system/configure-handlebar.js";
import { configureSystem } from "./system/configure-system.js";
import { renderCombatTracker } from "./system/render-combat-tracker.js";
import { renderChatMessage } from "./system/render-chat-message.js";
import { renderActorDirectory } from "./system/render-actor-directory.js";
import { registerSystemSettings } from "./settings.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("init", async function () {
  console.log(`Initializing Pirate Borg System`);

  registerSystemSettings();
  configureHandlebar();
  configureSystem();
});

Hooks.once("ready", () => {
  migrate();
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createPirateBorgMacro(data, slot));
  Hooks.call("pirateborgReady");
});

Hooks.on("renderActorDirectory", renderActorDirectory);

Hooks.on("renderCombatTracker", renderCombatTracker);

Hooks.on("renderChatMessage", renderChatMessage);
