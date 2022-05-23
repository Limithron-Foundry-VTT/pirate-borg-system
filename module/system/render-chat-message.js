import { diceSound, playDiceSound, showDice } from "../dice.js";
import { scrollChatToBottom } from "./sockets.js";
import { evaluateFormula, getTestOutcome } from "../utils.js";
import { drawMysticalMishaps } from "../compendium.js";

/**
 * @typedef {import('../utils.js').RollOutcome} RollOutcome
 */

export const BUTTON_ACTIONS = {
  ARCANE_RITUAL: "arcane-ritual",
  ANCIENT_RELIC: "ancient-relic",
  MYSTICAL_MISHAP: "mystical-mishap",
  SHANTIES: "shanties",
  EXTRA_RESOURCE: "extra-resource",
  REPAIR_CREW_ACTION: "repair-crew-action",
  DAMAGE: "damage",
};

export const DAMAGE_TYPE = {
  INFLICT: "inflick",
  TAKE: "take",
};

export const WIELD_ROLL_CHAT_MESSAGE_TEMPLATE = "systems/pirateborg/templates/chat/wield-roll.html";
export const MYSTICAL_MISHAP_CHAT_MESSAGE_TEMPLATE = "systems/pirateborg/templates/chat/mystical-mishap.html";
export const WIELD_DAMAGE_CHAT_MESSAGE_TEMPLATE = "systems/pirateborg/templates/chat/wield-damage.html";

/**
 * @param {ChatMessage} message
 * @param {jQuery} html
 */
export const renderChatMessage = async (message, html) => {
  html.on("click", "button.item-button", onChatCardAction.bind(this));
  if (game.user.isGM) {
    html.find(".gm-only").removeClass("gm-only");
  }
};

/**
 * @param {Event} event
 */
const onChatCardAction = async (event) => {
  event.preventDefault();

  const button = event.currentTarget;
  const messageContent = $(button.closest(".message-content"));
  const messageId = button.closest(".message").dataset.messageId;
  const message = game.messages.get(messageId);
  const actor = ChatMessage.getSpeakerActor(message.data.speaker);

  button.remove();

  if (!actor) {
    return;
  }

  const extraContent = await handleActions(actor, getData(button.dataset));
  if (extraContent) {
    await message.update({
      content: messageContent.find("form.roll-card").append($(extraContent)).end().html(),
      sound: diceSound(),
    });

    const lastMessage = Array.from(ui.chat.collection).pop();
    if (lastMessage && lastMessage.id === message.id) {
      scrollChatToBottom();
      ui.chat.scrollBottom();
    }
  }
};

/**
 * @param {Actor} actor
 * @param {Object} data
 * @returns {Promise<String>}
 */
const handleActions = async (actor, data) => {
  switch (data.action) {
    case BUTTON_ACTIONS.ARCANE_RITUAL:
      return await actionArcaneRitual(actor, data);
    case BUTTON_ACTIONS.ANCIENT_RELIC:
      return await actionAncientRelic(actor, data);
    case BUTTON_ACTIONS.MYSTICAL_MISHAP:
      return await actionMysticalMishap(data);
    case BUTTON_ACTIONS.SHANTIES:
      return await actionMysticShanties(actor, data);
    case BUTTON_ACTIONS.EXTRA_RESOURCE:
      return await actionExtraResource(actor, data);
    case BUTTON_ACTIONS.REPAIR_CREW_ACTION:
      return await actionRepairCrewAction(actor);
    case BUTTON_ACTIONS.DAMAGE:
      return await actionDamage(data);
  }
};

/**
 * @param {DOMStringMap} dataset
 * @returns {Object}
 */
const getData = (dataset) => {
  return {
    formula: dataset.formula,
    wieldFormula: dataset.wieldFormula ?? dataset.formula,
    wieldDR: dataset.dr ?? 12,
    armor: dataset.armor ?? 0,
    damage: dataset.damage ?? 0,
    isFumble: dataset.isFumble === "true",
    isCritical: dataset.isCritical === "true",
    critExtraDamage: dataset.critExtraDamage,
    action: dataset.action,
    damageType: dataset.damageType,
  };
};

/**
 * @param {String} formula
 * @param {String} wieldFormula
 * @param {String} wieldDR
 * @param {Object} rollData
 * @returns {Promise<{wieldOutcome: String, wieldRoll: Roll, wieldDR: Number, wieldFormula: String, rollOutcome: RollOutcome}>}
 */
const wieldInvokable = async (formula, wieldFormula, wieldDR, rollData) => {
  const wieldRoll = await evaluateFormula(formula, rollData);
  const rollOutcome = getTestOutcome(wieldRoll, wieldDR);

  await showDice(wieldRoll);
  playDiceSound();

  let wieldOutcome = "";

  if (rollOutcome.isSuccess) {
    wieldOutcome = `${game.i18n.localize(rollOutcome.isCriticalSuccess ? "PB.InvokableCriticalSuccess" : "PB.InvokableSuccess")}`;
  } else {
    wieldOutcome = `${game.i18n.localize(rollOutcome.isFumble ? "PB.InvokableFumble" : "PB.InvokableFailure")}`;
  }

  return {
    wieldFormula,
    wieldDR,
    wieldRoll,
    wieldOutcome: wieldOutcome,
    rollOutcome: rollOutcome,
  };
};

/**
 * @param {Actor} actor
 * @param {Object} data
 * @returns {Promise<String>}
 */
const actionArcaneRitual = async (actor, data) => {
  const rollResults = await wieldInvokable(data.formula, data.wieldFormula, data.wieldDR, actor.getRollData());

  if (rollResults.rollOutcome.isSuccess) {
    const newPowerUses = Math.max(0, actor.data.data.powerUses.value - 1);
    await actor.update({ "data.powerUses.value": newPowerUses });
  } else {
    rollResults.wieldOutcomeText = game.i18n.localize("PB.InvokableRitualFailure");
    rollResults.buttons = [
      {
        title: "PB.InvokableRitualFailureButton",
        data: {
          "is-fumble": rollResults.rollOutcome.isFumble,
          action: BUTTON_ACTIONS.MYSTICAL_MISHAP,
        },
      },
    ];
  }
  return await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, rollResults);
};

/**
 * @param {Actor} actor
 * @param {Object} data
 * @returns {Promise<String>}
 */
const actionAncientRelic = async (actor, data) => {
  const rollResults = await wieldInvokable(data.formula, data.wieldFormula, data.wieldDR, actor.getRollData());

  if (!rollResults.rollOutcome.isSuccess) {
    rollResults.wieldOutcomeText = game.i18n.localize(rollResults.rollOutcome.isFumble ? "PB.InvokableRelicFumble" : "PB.InvokableRelicFailure");
  }

  return await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, rollResults);
};

/**
 * @param {Object} data
 * @returns {Promise<String>}
 */
const actionMysticalMishap = async (data) => {
  const draw = await drawMysticalMishaps();

  await showDice(draw.roll);
  playDiceSound();

  return await renderTemplate(MYSTICAL_MISHAP_CHAT_MESSAGE_TEMPLATE, {
    title: game.i18n.format("PB.MysticalMishaps"),
    formula: data.isFumble ? "2d20kl" : "1d20",
    roll: draw.roll,
    items: draw.results,
  });
};

/**
 * @param {Actor} actor
 * @param {Object} data
 * @returns {Promise<String>}
 */
const actionMysticShanties = async (actor, data) => {
  await actor.update({ "data.shanties.value": Math.max(0, actor.data.data.shanties.value - 1) });
  const rollResults = await wieldInvokable(data.formula, data.wieldFormula, data.wieldDR, actor.getRollData());
  return await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, rollResults);
};

/**
 * @param {Actor} actor
 * @param {Object} data
 * @returns {Promise<String>}
 */
const actionExtraResource = async (actor, data) => {
  const rollResults = await wieldInvokable(data.formula, data.wieldFormula, data.wieldDR, actor.getRollData());
  return await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, rollResults);
};

/**
 * @param {Actor} actor
 * @returns {Promise<String>}
 */
const actionRepairCrewAction = async (actor) => {
  const wieldRoll = await evaluateFormula("d6");

  await showDice(wieldRoll);
  playDiceSound();

  await actor.update({ "data.hp.value": Math.min(actor.data.data.hp.max, actor.data.data.hp.value + wieldRoll.total) });

  return await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, {
    wieldOutcome: game.i18n.localize("PB.Heal"),
    wieldRoll,
    wieldFormula: "d6",
  });
};

/**
 * @param {Object} data
 * @returns {Promise<String>}
 */
const actionDamage = async (data) => {
  const damageFormula = data.isCritical ? (data.critExtraDamage ? `((${data.damage}) * 2) + ${data.critExtraDamage}` : `(${data.damage}) * 2`) : data.damage;
  const damageRoll = await evaluateFormula(damageFormula);
  const armorRoll = await evaluateFormula(data.armor);
  const totalDamage = Math.max(0, damageRoll.total - armorRoll.total);

  await showDice(Roll.fromTerms([PoolTerm.fromRolls([damageRoll, armorRoll])]));
  playDiceSound();

  return await renderTemplate(WIELD_DAMAGE_CHAT_MESSAGE_TEMPLATE, {
    damageOutcome: `${game.i18n.localize(data.damageType === DAMAGE_TYPE.TAKE ? "PB.Take" : "PB.Inflict")} ${totalDamage} ${game.i18n.localize("PB.Damage")}`,
    damageRoll,
    armorRoll,
  });
};
