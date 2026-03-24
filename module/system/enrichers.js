/**
 * Pirate Borg Custom Text Enrichers
 *
 * This module provides custom enrichers for the Pirate Borg system, including:
 * - Roll enricher: [[/r formula]]
 * - Damage enricher: [[/damage formula type]]
 * - Heal enricher: [[/heal formula]]
 * - Check enricher: [[/check ability dc?]]
 * - Save enricher: [[/save ability dr?]]
 * - Reference enricher: &Reference[term]
 * - Lookup enricher: [[lookup @path]]
 */

// =============================================================================
// Ability Mappings
// =============================================================================

/**
 * Map of ability abbreviations to full names
 */
const ABILITY_MAP = {
  str: "strength",
  strength: "strength",
  agi: "agility",
  agility: "agility",
  pre: "presence",
  presence: "presence",
  tgh: "toughness",
  toughness: "toughness",
  spi: "spirit",
  spirit: "spirit",
};

/**
 * Map of ability names to their localization keys
 */
const ABILITY_LABELS = {
  strength: "PB.AbilityStrength",
  agility: "PB.AbilityAgility",
  presence: "PB.AbilityPresence",
  toughness: "PB.AbilityToughness",
  spirit: "PB.AbilitySpirit",
};

function getConditionData(term) {
  switch (term) {
    case "poisoned":
      return game.pirateborg.config.systemEffects.poison;
    default:
      return game.pirateborg.config.systemEffects[term];
  }
}

// =============================================================================
// Enricher Registration
// =============================================================================

/**
 * Register all custom enrichers for the Pirate Borg system.
 * Should be called during system initialization.
 */
export const registerEnrichers = () => {
  // Roll enricher: [[/r formula]]
  CONFIG.TextEditor.enrichers.push({
    id: "pb-roll",
    pattern: /\[\[\/r(?:oll)?\s+([^\]]+)\]\]/gi,
    enricher: enrichRoll,
  });

  // Check enricher: [[/check ability dr?]]
  CONFIG.TextEditor.enrichers.push({
    id: "pb-check",
    pattern: /\[\[\/check\s+([^\]]+)\]\]/gi,
    enricher: enrichCheck,
  });

  // Reference enricher: &Reference[term]
  CONFIG.TextEditor.enrichers.push({
    id: "pb-reference",
    pattern: /&Reference\[([^\]]+)\]/gi,
    enricher: enrichReference,
  });

  // Lookup enricher: [[lookup @path]]
  CONFIG.TextEditor.enrichers.push({
    id: "pb-lookup",
    pattern: /\[\[lookup\s+(@[^\]]+)\]\]/gi,
    enricher: enrichLookup,
  });

  console.log("Pirate Borg | Registered custom text enrichers");
};

// =============================================================================
// Enricher Functions
// =============================================================================

/**
 * Enricher for inline rolls: [[/r 1d20+3]]
 * Creates a clickable dice roll link.
 *
 * @param {RegExpMatchArray} match - The regex match
 * @param {object} options - Enrichment options
 * @returns {HTMLElement} The enriched element
 */
async function enrichRoll(match) {
  const formula = match[1].trim();

  const a = document.createElement("a");
  a.classList.add("pb-roll-link", "inline-roll");
  a.dataset.formula = formula;
  a.dataset.action = "roll";
  a.setAttribute("draggable", "false");

  const icon = document.createElement("i");
  icon.classList.add("fas", "fa-dice-d20");
  a.appendChild(icon);

  const text = document.createTextNode(` ${formula}`);
  a.appendChild(text);

  // Add click handler via data attribute for event delegation
  a.dataset.tooltip = game.i18n.localize("PB.ClickToRoll");

  return a;
}

/**
 * Enricher for ability checks: [[/check agility 12]]
 *   [[/check presence 14]]
 * Creates a clickable ability check link with optional DR.
 *
 * @param {RegExpMatchArray} match - The regex match
 * @param {object} options - Enrichment options
 * @returns {HTMLElement} The enriched element
 */
async function enrichCheck(match) {
  const content = match[1].trim();
  const parts = content.split(/\s+/);

  let ability = "";
  let dr = 12;

  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    if (ABILITY_MAP[lowerPart]) {
      ability = ABILITY_MAP[lowerPart];
    } else if (/^\d+$/.test(part)) {
      dr = parseInt(part);
    }
  }

  if (!ability) {
    // Return original text if no valid ability found
    const span = document.createElement("span");
    span.textContent = match[0];
    return span;
  }

  const a = document.createElement("a");
  a.classList.add("pb-check-link", "inline-roll");
  a.dataset.ability = ability;
  a.dataset.action = "check";
  if (dr !== null) {
    a.dataset.dr = dr;
  }
  a.setAttribute("draggable", "false");

  const icon = document.createElement("i");
  icon.classList.add("fas", "fa-dice-d20");
  a.appendChild(icon);

  // Build display text
  let displayText = "";
  if (dr !== null) {
    displayText = ` DR ${dr} `;
  }
  displayText += game.i18n.localize(ABILITY_LABELS[ability]);

  const text = document.createTextNode(displayText);
  a.appendChild(text);

  a.dataset.tooltip = game.i18n.format("PB.ClickToRollCheck", {
    ability: game.i18n.localize(ABILITY_LABELS[ability]),
  });

  return a;
}

/**
 * Enricher for references: &Reference[poisoned]
 * Creates a reference link with tooltip for conditions and rules.
 *
 * @param {RegExpMatchArray} match - The regex match
 * @param {object} options - Enrichment options
 * @returns {HTMLElement} The enriched element
 */
async function enrichReference(match) {
  const term = match[1].trim().toLowerCase();

  const condition = getConditionData(term);

  const span = document.createElement("span");
  span.classList.add("pb-reference-link");
  span.setAttribute("draggable", "false");

  if (condition) {
    if (condition.icon) {
      const icon = document.createElement("i");
      icon.classList.add("fas", condition.icon);
      span.appendChild(icon);
    }

    const label = document.createTextNode(` ${game.i18n.localize(condition.name)}`);
    span.appendChild(label);

    // Add tooltip with description
    const description = game.i18n.has(condition.description) ? game.i18n.localize(condition.description) : "";
    if (description) {
      span.dataset.tooltip = description;
    }

    span.dataset.condition = term;
    span.dataset.action = "reference";
  } else {
    // Unknown reference - just display the term
    span.textContent = term;
    span.classList.add("unknown-reference");
    span.dataset.tooltip = game.i18n.format("PB.UnknownReference", { reference: term });
  }

  return span;
}

/**
 * Enricher for lookups: [[lookup @name]]
 * Displays dynamic data from the document's roll data.
 *
 * @param {RegExpMatchArray} match - The regex match
 * @param {object} options - Enrichment options
 * @returns {HTMLElement} The enriched element
 */
async function enrichLookup(match, options) {
  const path = match[1].trim();

  const span = document.createElement("span");
  span.classList.add("pb-lookup-value");

  // Try to resolve the path from roll data
  let value = path;

  // If we have a relativeTo document, try to resolve the path
  if (options.relativeTo) {
    try {
      const rollData = options.relativeTo.getRollData?.() || {};
      // Remove the leading @ and resolve the path
      const cleanPath = path.startsWith("@") ? path.slice(1) : path;
      value = foundry.utils.getProperty(rollData, cleanPath) ?? path;
    } catch (e) {
      // If resolution fails, display the original path
      value = path;
    }
  }

  span.textContent = String(value);
  span.dataset.path = path;
  span.dataset.tooltip = `Dynamic value: ${path}`;

  return span;
}

// =============================================================================
// Click Handler Registration
// =============================================================================

/**
 * Register click handlers for enriched content.
 * This should be called to enable interactivity for enriched elements.
 */
export const registerEnricherClickHandlers = () => {
  // Use event delegation on the document body for all enricher clicks
  document.body.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;

    switch (action) {
      case "roll":
        await handleRollClick(target);
        break;
      case "check":
        await handleCheckClick(target);
        break;
      case "reference":
        await handleReferenceClick(target);
        break;
    }
  });

  console.log("Pirate Borg | Registered enricher click handlers");
};

/**
 * Handle click on a roll enricher
 */
async function handleRollClick(element) {
  const formula = element.dataset.formula;
  if (!formula) return;

  try {
    const roll = new Roll(formula);
    await roll.evaluate();
    await roll.toMessage({
      flavor: game.i18n.localize("PB.Roll"),
      speaker: ChatMessage.getSpeaker(),
    });
  } catch (e) {
    ui.notifications.error(`Invalid roll formula: ${formula}`);
  }
}

/**
 * Handle click on a check enricher
 */
async function handleCheckClick(element) {
  const ability = element.dataset.ability;
  const dr = element.dataset.dr ? parseInt(element.dataset.dr) : null;
  if (!ability) return;

  // Get the selected actor or user's character
  const actor = canvas.tokens.controlled[0]?.actor || game.user.character;

  if (!actor) {
    ui.notifications.warn(game.i18n.localize("PB.NoActorSelected"));
    return;
  }

  // Get the ability value from the actor
  const abilityValue = actor.system?.abilities?.[ability]?.value ?? 0;
  const formula = `d20+${abilityValue}`;

  try {
    const roll = new Roll(formula);
    await roll.evaluate();

    let flavor = `${game.i18n.localize(ABILITY_LABELS[ability])} ${game.i18n.localize("PB.Check")}`;
    if (dr !== null) {
      const success = roll.total >= dr;
      flavor += ` (DR ${dr}) - ${success ? game.i18n.localize("PB.Success") : game.i18n.localize("PB.Failure")}`;
    }

    await roll.toMessage({
      flavor,
      speaker: ChatMessage.getSpeaker({ actor }),
    });
  } catch (e) {
    ui.notifications.error(`Failed to roll check: ${e.message}`);
  }
}

/**
 * Handle click on a reference enricher
 */
async function handleReferenceClick(element) {
  const condition = element.dataset.condition;
  if (!condition) return;

  const conditionData = getConditionData(condition);
  if (!conditionData) return;

  // Could open a journal entry, apply the condition, or show more info
  // For now, just show a notification with the description
  const label = game.i18n.localize(conditionData.name);
  const description = game.i18n.has(conditionData.description) ? game.i18n.localize(conditionData.description) : "";

  if (description) {
    ui.notifications.info(`${label}: ${description}`);
  }
}
