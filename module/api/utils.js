/**
 * @param {function[]} fns
 * @return {function(*): *}
 */
export const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

/**
 * @param {function(*): Promise<*>} fns
 * @return {function(*): Promise<*>}
 */
export const asyncPipe =
  (...fns) =>
  (x) =>
    fns.reduce(async (y, f) => f(await y), x);

/**
 * @param {String} formula
 * @param {Object} [data]
 * @return {Promise<Roll>}
 */
export const evaluateFormula = async (formula, data) => {
  const roll = new Roll(formula, data);
  if (game.release.generation >= 12) {
    return roll.evaluate();
  }
  return roll.evaluate({ async: true });
};

/**
 * @param {foundry.abstract.Document} document
 * @param {any} flag
 * @param {any} value
 * @return {Promise<any>}
 */
export const setSystemFlag = async (document, flag, value) => document.setFlag(CONFIG.PB.flagScope, flag, value);

/**
 * @param {foundry.abstract.Document} document
 * @param {any} flag
 * @return {any}
 */
export const getSystemFlag = (document, flag) => document.getFlag(CONFIG.PB.flagScope, flag);

// V10 Backward compatibility
/**
 * @param {Token} token
 * @return {Number}
 */
export const getTokenRotation = (token) => token.document.rotation;

/**
 * @param {Token} token
 * @return {Number}
 */
export const getTokenWidth = (token) => token.document.width;

/**
 * @param {Token} token
 * @return {Number}
 */
export const getTokenScale = (token) => token.document.texture?.scaleX;

/**
 * @param {ChatMessage} chatMessage
 * @return {Object}
 */
export const getMessageSpeaker = (chatMessage) => chatMessage.speaker;

/**
 * @param {ChatMessage} chatMessage
 * @return {String}
 */
export const getMessageContent = (chatMessage) => chatMessage.content;

/**
 * @param {Object} dropData
 * @return {Promise<{actor: Actor, item: Item}>}
 */
export const getInfoFromDropData = async (dropData) => {
  const itemFromUuid = dropData.uuid ? await fromUuid(dropData.uuid) : null;
  const actor = itemFromUuid
    ? itemFromUuid.actor
    : dropData.sceneId
    ? game.scenes.get(dropData.sceneId).tokens.get(dropData.tokenId).actor
    : game.actors.get(dropData.actorId);
  const item = actor ? (itemFromUuid ? itemFromUuid : actor.items.get(dropData.data._id)) : null;
  return { actor, item };
};

/**
 * @param {TableResult} result
 * @return {Number}
 */
export const getResultType = (result) => result.type;

/**
 * @param {TableResult} result
 * @return {String}
 */
export const getResultCollection = (result) => {
  if (game.release.generation >= 13) {
    const parsedUuid = foundry.utils.parseUuid(result.documentUuid);
    return parsedUuid?.collection?.metadata?.id ?? parsedUuid.type ?? "";
  }

  return result.documentCollection;
}

/**
 * @param {TableResult} result
 * @return {String}
 */
export const getResultText = (result) => {
  if (game.release.generation >= 13) {
    return result.type === "text" ? result.description : result.name;
  }

  return result.text;
}

/**
 * @param {TableResult[]} results
 * @param {String} [separator=", "]
 * @return {String}
 */
export const getResultsAsText = (results, separator = ", ") => results.map((r) => r.getChatText()).join(separator);

/**
 * @param {Macro} macro
 * @return {String}
 */
export const getMacroCommand = (macro) => macro.command;

/**
 * @param {Combatant} combatant
 * @return {Number}
 */
export const getCombatantInitiative = (combatant) => combatant.initiative;

/**
 * @param {Token} token
 * @return {Number}
 */
export const getTokenDisposition = (token) => token.disposition ?? token.data.disposition;

/**
 * @param {Document} document
 * @return {Object}
 */
export const getDocumentFlags = (document) => document.flags;

/**
 * @return {String}
 */
export const getSystemVersion = () => game.system.version;

/**
 * @param {Object} module
 * @return {Array}
 */
export const getModuleDependencies = (module) => module?.relationships?.requires ?? [];

/**
 * @param {String} type
 * @return {Object}
 */
export const getActorDefaults = (type) => {
  return CONFIG.PB.actorDefaults[type] ?? {};
};
