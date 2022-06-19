import { createPirateBorgMacro } from "./api/macros.js";
import { migrate } from "./system/migrate.js";
import { configureHandlebar } from "./system/configure-handlebar.js";
import { configureSystem } from "./system/configure-system.js";
import { renderCombatTracker } from "./system/render-combat-tracker.js";
import { handleChatMessageAutomation, handleChatMessageButton, handleChatMessageGMOnly } from "./system/render-chat-message.js";
import { renderActorDirectory } from "./system/render-actor-directory.js";
import { registerSystemSettings } from "./system/settings.js";
import { showHelpDialogOnStartup } from "./dialog/help-dialog.js";
import { renderSettings } from "./system/render-settings.js";
import { registerSocketHandler } from "./system/sockets.js";
import { onDragRulerReady } from "./system/drag-ruler.js";
import { registerAutomation } from "./system/register-automation.js";

Hooks.once("init", async () => {
  console.log(`Initializing Pirate Borg System`);
  registerSystemSettings();
  configureHandlebar();
  configureSystem();
  registerSocketHandler();
});

Hooks.once("ready", () => {
  migrate();
  showHelpDialogOnStartup();
  registerAutomation();
  Hooks.on("hotbarDrop", (bar, data, slot) => createPirateBorgMacro(data, slot));

  // To fix a strange behavior with foundry
  ui.chat.scrollBottom();

  Hooks.on("getCompendiumFolderDirectoryEntryContext", async (html, options) => {
    console.log(html, options);
  });
});

Hooks.on("renderActorDirectory", renderActorDirectory);
Hooks.on("renderCombatTracker", renderCombatTracker);
Hooks.on("renderSettings", renderSettings);
Hooks.on("renderChatMessage", handleChatMessageButton);
Hooks.on("renderChatMessage", handleChatMessageGMOnly);
Hooks.on("renderChatMessage", handleChatMessageAutomation);
Hooks.on("dragRuler.ready", onDragRulerReady);
