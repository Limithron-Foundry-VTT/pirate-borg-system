/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

import {
  handleTeleportRequestGM,
  handleTokenSelectRequestPlayer,
} from "./teleport.js";
import { hookModifyDocument, handleModifyEmbeddedDocument } from "./dataQuirks.js";
import { injectControls } from "./toolbar.js";
import { injectStairways } from "./injection.js";
import { Stairway } from "./Stairway.js";
import { StairwayLayer } from "./StairwayLayer.js";

/**
 * Initialize stairways system - called during "init" hook
 */
export function initStairways() {
  console.log("Pirate Borg | Initializing Stairways system");

  // inject stairway layer / embedded document in hardcoded places
  injectStairways();
}

/**
 * Setup stairways system - called during "setup" hook
 */
export function setupStairways() {
  // Hook modifyDocument to intercept stairway operations
  hookModifyDocument();
}

/**
 * Register stairway hooks - called during "ready" hook
 */
export function registerStairwayHooks() {
  // visibility refresh for stairway controls
  Hooks.on("sightRefresh", (sightLayer) => {
    if (!canvas.controls?.stairways) return;
    
    // Stairway Icons
    for (const sw of canvas.controls.stairways.children) {
      sw.visible = !sw.stairway.document.hidden || game.user.isGM;
      if (sightLayer.tokenVision) {
        sw.visible &&= sw.isVisible;
      }
    }
  });

  // Handle paste events
  Hooks.on(`paste${Stairway.embeddedName}`, StairwayLayer.onPasteStairway);

  // Canvas ready check
  Hooks.once("canvasReady", () => {
    if (!canvas.stairways) {
      console.error("Pirate Borg Stairways | Layer failed to load!");
    } else {
      console.log("Pirate Borg Stairways | Layer is ready.");
    }
  });
}

/**
 * Register the getSceneControlButtons hook - called during "init"
 */
export function registerControlsHook() {
  console.log("Pirate Borg Stairways | Registering getSceneControlButtons hook");
  Hooks.on("getSceneControlButtons", (controls) => {
    console.log("Pirate Borg Stairways | getSceneControlButtons hook called, isGM:", game.user?.isGM);
    if (!game.user.isGM) return;
    injectControls(controls);
  });
}

/**
 * Handle stairway-related socket events
 * @param {object} message - Socket message
 */
export function handleStairwaySocketEvent(message) {
  const { action, eventName, data } = message;

  // Handle action-based messages (from StairwayControl or dataQuirks)
  if (action === "stairway" && eventName) {
    switch (eventName) {
      case "teleportRequestGM":
        handleTeleportRequestGM(data);
        break;
      case "tokenSelectRequestPlayer":
        handleTokenSelectRequestPlayer(data);
        break;
      case "modifyDocument":
        handleModifyEmbeddedDocument(data);
        break;
      default:
        console.warn("Pirate Borg Stairways | Unknown socket event:", eventName);
    }
    return;
  }

  // Handle legacy action-based messages
  switch (action) {
    case "stairway-teleport-request":
      handleTeleportRequestGM(data || message.data);
      break;
    case "stairway-token-select":
      handleTokenSelectRequestPlayer(data || message.data);
      break;
    default:
      // Unknown action, ignore
      break;
  }
}
