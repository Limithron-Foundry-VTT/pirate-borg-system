import { createPirateBorgMacro } from "./macros.js";
import { migrate } from "./system/migrate.js";
import { configureHandlebar } from "./system/configure-handlebar.js";
import { configureSystem } from "./system/configure-system.js";
import { renderCombatTracker } from "./system/render-combat-tracker.js";
import { renderChatMessage } from "./system/render-chat-message.js";
import { renderActorDirectory } from "./system/render-actor-directory.js";
import { registerSystemSettings } from "./system/settings.js";
import { showHelpDialogOnStartup } from "./dialog/help-dialog.js";
import { renderSettings } from "./system/render-settings.js";
import { registerSocketHandler } from "./system/sockets.js";

Hooks.once("init", async function () {
  console.log(`Initializing Pirate Borg System`);
  registerSystemSettings();
  configureHandlebar();
  configureSystem();
  registerSocketHandler();
});

Hooks.once("ready", () => {
  migrate();
  showHelpDialogOnStartup();
  Hooks.on("hotbarDrop", (bar, data, slot) => createPirateBorgMacro(data, slot));
  Hooks.call("pirateborgReady");

  // To fix a strange behavior with foundry
  ui.chat.scrollBottom();
});

Hooks.on("renderActorDirectory", renderActorDirectory);

Hooks.on("renderCombatTracker", renderCombatTracker);

Hooks.on("renderSettings", renderSettings);

Hooks.on("renderChatMessage", renderChatMessage);
