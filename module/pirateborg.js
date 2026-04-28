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
import { configureAutomation } from "./system/configure-automation.js";
import { registerFonts } from "./system/fonts.js";
import { registerEnrichers, registerEnricherClickHandlers } from "./system/enrichers.js";
import { alterTokenHUDStatusEffects } from "./system/token-hud.js";
import { registerChatRenderers } from "./chat-message/renderers/register-chat-renderers.js";

Hooks.once("init", async () => {
  console.log(`Initializing Pirate Borg System`);

  Hooks.on("renderActorDirectory", renderActorDirectory);
  Hooks.on("renderCombatTracker", renderCombatTracker);
  Hooks.on("renderSettings", renderSettings);
  if (foundry.utils.isNewerVersion(game.version, "13")) {
    Hooks.on("renderChatMessageHTML", handleChatMessageButton);
    Hooks.on("renderChatMessageHTML", handleChatMessageGMOnly);
    Hooks.on("renderChatMessageHTML", handleChatMessageAutomation);
  } else {
    Hooks.on("renderChatMessage", handleChatMessageButton);
    Hooks.on("renderChatMessage", handleChatMessageGMOnly);
    Hooks.on("renderChatMessage", handleChatMessageAutomation);
  }
  registerChatRenderers();
  Hooks.on("dragRuler.ready", onDragRulerReady);

  const applyPauseStyling = (html) => {
    const root = Array.isArray(html) ? html[0] : html?.jquery ? html.get(0) : html;
    if (!root || typeof root.querySelector !== "function") return;
    root.classList?.add("pirateborg");
    const img = root.querySelector("img");
    if (img) {
      img.src = "systems/pirateborg/ui/limithron-distressed-flag.webp";
      img.className = "";
    }
  };

  Hooks.on("renderPause", (app, html) => applyPauseStyling(html));
  Hooks.on("renderGamePause", (app, html) => applyPauseStyling(html));

  registerSystemSettings();
  registerFonts();
  configureHandlebar();
  configureSystem();
  registerSocketHandler();
  registerEnrichers();
});

Hooks.once("ready", () => {
  migrate();
  showHelpDialogOnStartup();
  configureAutomation();
  registerEnricherClickHandlers();

  // hotbarDrop hook cannot be async and still block the default macro creation workflow,
  Hooks.on("hotbarDrop", (bar, data, slot) => createPirateBorgMacro(data, slot));

  Hooks.on("renderTokenHUD", (app, html) => {
    alterTokenHUDStatusEffects.call(app, html);
  });

  ui.chat.scrollBottom();
});
