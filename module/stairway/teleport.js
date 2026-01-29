/**
 * Stairways Implementation for Pirate Borg System
 * Based on the Stairways module by Simon Wörner (SWW13)
 * Licensed under MIT License - see LICENSE-MIT.txt
 */

/**
 * Get all active GMs sorted by ID
 * @returns {User[]}
 */
export const getActiveGMs = () => {
  return [...game.users.values()].filter((u) => u.active && u.isGM).sort((a, b) => (a.id > b.id ? 1 : -1));
};

// Alias for backwards compatibility
export const GMs = getActiveGMs;

/**
 * Check if current user is the first active GM
 * @returns {boolean}
 */
const isFirstGM = () => {
  return getActiveGMs().findIndex((u) => u.id === game.userId) === 0;
};

/**
 * Perform teleportation using a stairway
 * @param {Stairway} stairway - The stairway being used
 */
export async function performTeleport(stairway) {
  const { targetScene, targetData } = stairway.target;

  // No partner found
  if (!targetData) {
    ui.notifications.warn(game.i18n.localize("STAIRWAYS.NoPartner"));
    return;
  }

  // Get selected tokens
  const selectedTokenIds = canvas.tokens.controlled.map((t) => t.id);
  if (selectedTokenIds.length === 0 && !game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("STAIRWAYS.NoTokenSelected"));
    return;
  }

  // Build teleport data
  const data = {
    sourceSceneId: canvas.scene.id,
    sourceData: stairway.document.toObject(),
    selectedTokenIds,
    targetSceneId: targetScene?.id ?? null,
    targetData: targetData.toObject ? targetData.toObject() : targetData,
    userId: game.userId,
  };

  // Call pre-teleport hook (return false to cancel)
  const canTeleport = Hooks.call("PreStairwayTeleport", data);
  if (canTeleport === false) {
    return;
  }

  // Same scene teleport
  if (!targetScene) {
    await performSameSceneTeleport(data);
  } else {
    // Cross-scene teleport
    if (game.user.isGM) {
      // GM can do it directly
      await handleTeleportRequestGM(data);
    } else {
      // Player needs to request GM assistance
      game.socket.emit("system.pirateborg", {
        action: "stairway-teleport-request",
        data,
      });
    }
  }
}

/**
 * Perform same-scene teleportation
 * @param {object} data - Teleport data
 */
async function performSameSceneTeleport(data) {
  const { selectedTokenIds, targetData, sourceData } = data;

  // Get tokens to teleport
  const tokens = canvas.tokens.placeables.filter((t) => selectedTokenIds.includes(t.id));

  // Calculate target position
  for (const token of tokens) {
    const newX = Math.round(targetData.x - (token.document.width * canvas.grid.size) / 2);
    const newY = Math.round(targetData.y - (token.document.height * canvas.grid.size) / 2);

    // Animate or instant move
    if (sourceData.animate) {
      await token.document.update({ x: newX, y: newY }, { animate: true });
    } else {
      await token.document.update({ x: newX, y: newY }, { animate: false });
    }
  }

  // Pan to target if animate is enabled
  if (sourceData.animate) {
    canvas.animatePan({ x: targetData.x, y: targetData.y });
  }

  // Call post-teleport hook
  Hooks.callAll("StairwayTeleport", data);
}

/**
 * Handle teleport request from player (GM only)
 * @param {object} data - Teleport data
 */
export async function handleTeleportRequestGM(data) {
  const { sourceSceneId, selectedTokenIds, targetSceneId, targetData, userId } = data;

  // Ignore teleport requests if not GM or not the first GM
  if (!game.user.isGM || !isFirstGM()) {
    return;
  }

  // Find scenes
  const sourceScene = game.scenes.get(sourceSceneId);
  const targetScene = game.scenes.get(targetSceneId);
  if (!sourceScene || !targetScene) {
    console.warn("Stairway: source/target scene not found", data);
    return;
  }

  // Get selected tokens data
  const selectedTokensData = foundry.utils.duplicate(
    sourceScene.tokens.filter((token) => selectedTokenIds.indexOf(token.id) >= 0)
  );

  // Set new token positions
  for (const token of selectedTokensData) {
    token.x = Math.round(targetData.x - (token.width * targetScene.grid.size) / 2);
    token.y = Math.round(targetData.y - (token.height * targetScene.grid.size) / 2);
  }

  // Remove selected tokens from current scene
  await sourceScene.deleteEmbeddedDocuments("Token", selectedTokenIds, { isUndo: true });

  // Add selected tokens to target scene
  await targetScene.createEmbeddedDocuments("Token", selectedTokensData, { isUndo: true });

  // If the GM requested the teleport, handle scene switch locally
  if (userId === game.userId) {
    await handleTokenSelectRequestPlayer(data);
  } else {
    // Request token select from player
    game.socket.emit("system.pirateborg", {
      action: "stairway-token-select",
      data,
    });
  }
}

/**
 * Handle token select request for player after cross-scene teleport
 * @param {object} data - Teleport data
 */
export async function handleTokenSelectRequestPlayer(data) {
  const { selectedTokenIds, targetSceneId, targetData, userId } = data;

  // Ignore requests for other players
  if (userId !== game.userId) {
    return;
  }

  // Find target scene
  const targetScene = game.scenes.get(targetSceneId);
  if (!targetScene) {
    console.warn("Stairway: target scene not found", data);
    return;
  }

  // Switch to target scene
  await targetScene.view();

  // Wait a bit for the scene to load
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Re-select tokens on target scene
  const targetTokens = canvas.tokens.placeables.filter((token) => selectedTokenIds.indexOf(token.id) >= 0);
  for (const token of targetTokens) {
    token.control({ releaseOthers: false });
  }

  // Pan to stairway target
  canvas.animatePan({ x: targetData.x, y: targetData.y });

  // Call post-teleport hook
  Hooks.callAll("StairwayTeleport", data);
}
