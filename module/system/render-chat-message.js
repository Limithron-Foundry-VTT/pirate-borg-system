import { diceSound, playDiceSound, showDice } from "../dice.js";
import { scrollChatToBottom } from "../sockets.js";
import { evaluateFormula } from "../utils.js";

export const WIELD_ROLL_CHAT_MESSAGE_TEMPLATE = "systems/pirateborg/templates/chat/wield-roll.html";
export const MYSTICAL_MISHAP_CHAT_MESSAGE_TEMPLATE = "systems/pirateborg/templates/chat/mystical-mishap.html";
export const WIELD_DAMAGE_CHAT_MESSAGE_TEMPLATE = "systems/pirateborg/templates/chat/wield-damage.html";

export const renderChatMessage = async (message, html) => {
  html.on("click", "button.item-button", onChatCardAction.bind(this));
  if (game.user.isGM) {
    html.find(".gm-only").removeClass("gm-only");
  }
};

/**
 * Rolls the dice and wields the results.
 * @param {string} formula - The formula to be rolled
 * @param {string} wieldFormula - The "pretty" formula to display in the chat card
 * @param {int} dr - The DR to be tested against
 * @param {object} rollData - The data to be used in the roll
 * @returns {Promise<{wieldOutcome: string, isCrit: boolean, isFumble: boolean, wieldRoll: *, d20Result: *, wieldDR: number, isSuccess: boolean}>}
 */
async function wieldRoll(formula, wieldFormula, dr, rollData) {
  const wieldRoll = new Roll(formula, rollData);
  wieldRoll.evaluate({ async: false });
  await showDice(wieldRoll);

  playDiceSound();

  const d20Result = wieldRoll.terms[0].results[0].result;
  const isFumble = d20Result === 1;
  const isCrit = d20Result === 20;
  const isSuccess = wieldRoll.total >= dr;

  let wieldOutcome;

  if (isSuccess) {
    wieldOutcome = `${game.i18n.localize(isCrit ? "PB.InvokableCriticalSuccess" : "PB.InvokableSuccess")}`;
  } else {
    wieldOutcome = `${game.i18n.localize(isFumble ? "PB.InvokableFumble" : "PB.InvokableFailure")}`;
  }

  return { wieldRoll, wieldFormula, d20Result, isFumble, isCrit, wieldDR: dr, isSuccess, wieldOutcome };
}

const getData = (dataset) => {
  return {
    formula: dataset.formula,
    wieldFormula: dataset.wieldFormula ?? dataset.formula,
    wieldDR: dataset.dr ?? 10,
    armor: dataset.armor ?? 0,
    damage: dataset.damage ?? 0,
    isFumble: dataset.isFumble === "true",
    isCritical: dataset.isCritical === "true",
    isArcaneRitual: dataset.isArcaneRitual === "true",
    isAncientRelic: dataset.isAncientRelic === "true",
    isMysticalMishap: dataset.isMysticalMishap === "true",
    isShanties: dataset.isShanties === "true",
    isExtraResource: dataset.isExtraResource === "true",
    isRepairCrewAction: dataset.isRepairCrewAction === "true",
    isDamage: dataset.isDamage === "true",
  };
};

export const onChatCardAction = async (event) => {
  event.preventDefault();

  // Extract card data
  const button = event.currentTarget;
  let messageContent = $(button.closest(".message-content"));
  const messageId = button.closest(".message").dataset.messageId;
  const message = game.messages.get(messageId);
  const speaker = message.data.speaker;
  const actor = ChatMessage.getSpeakerActor(speaker);

  /*const formula = button.dataset.formula;
  const wieldFormula = button.dataset.wieldFormula ?? formula;
  const wieldDR = button.dataset.dr ?? 10;
  const armor = button.dataset.armor ?? 0;

  const isFumble = button.dataset.isFumble  === 'true';
  const isCritical = button.dataset.isCritical === 'true';

  const isArcaneRitual = button.dataset.isArcaneRitual === 'true';
  const isAncientRelic = button.dataset.isAncientRelic === 'true';
  const isMysticalMishap = button.dataset.isMysticalMishap === 'true';
  const isShanties = button.dataset.isShanties === 'true';
  const isExtraResource = button.dataset.isExtraResource === 'true';
  const isRepairCrewAction = button.dataset.isRepairCrewAction === 'true';
  const isBroadsidesCrewAction = button.dataset.isBroadsidesCrewAction === 'true';*/

  const data = getData(button.dataset);

  console.log("button.dataset", button.dataset, button.dataset.isCritical, data.isCritical);

  button.remove();

  let needsToBeSaved = false;

  let additionalContent = $("<div>");

  if (!actor) {
    return;
  }

  if (data.isArcaneRitual && actor) {
    const rollResults = await wieldRoll(data.formula, data.wieldFormula, data.wieldDR, actor.getRollData());

    if (rollResults.isSuccess) {
      const newPowerUses = Math.max(0, actor.data.data.powerUses.value - 1);
      await actor.update({ "data.powerUses.value": newPowerUses });
    } else {
      rollResults.wieldOutcomeText = game.i18n.localize("PB.InvokableRitualFailure");
      rollResults.buttons = [
        {
          title: "PB.InvokableRitualFailureButton",
          data: {
            "is-fumble": rollResults.isFumble,
            "is-mystical-mishap": true,
          },
        },
      ];
    }
    const extraContent = await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, rollResults);
    additionalContent = additionalContent.append(extraContent);

    needsToBeSaved = true;
  }

  if (data.isExtraResource && actor) {
    const rollResults = await wieldRoll(data.formula, data.wieldFormula, data.wieldDR, actor.getRollData());

    const extraContent = await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, rollResults);
    additionalContent = additionalContent.append(extraContent);

    needsToBeSaved = true;
  }

  if (data.isAncientRelic && actor) {
    const rollResults = await wieldRoll(data.formula, data.wieldFormula, data.wieldDR, actor.getRollData());

    if (!rollResults.isSuccess) {
      rollResults.wieldOutcomeText = game.i18n.localize(rollResults.isFumble ? "PB.InvokableRelicFumble" : "PB.InvokableRelicFailure");
    }

    const extraContent = await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, rollResults);
    additionalContent = additionalContent.append(extraContent);

    needsToBeSaved = true;
  }

  if (data.isShanties && actor) {
    await actor.update({ "data.shanties.value": Math.max(0, actor.data.data.shanties.value - 1) });
    const rollResults = await wieldRoll(data.formula, data.wieldFormula, data.wieldDR, actor.getRollData());

    const extraContent = await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, rollResults);
    additionalContent = additionalContent.append(extraContent);

    needsToBeSaved = true;
  }

  if (data.isMysticalMishap && actor) {
    const mishapData = await actor.rollMysticalMishap(data.isFumble);
    await showDice(mishapData.roll);
    playDiceSound();
    
    const extraContent = await renderTemplate(MYSTICAL_MISHAP_CHAT_MESSAGE_TEMPLATE, mishapData);
    additionalContent = additionalContent.append(extraContent);

    needsToBeSaved = true;
  }

  if (data.isRepairCrewAction && actor) {
    const roll = await evaluateFormula("d6");
    await showDice(wieldRoll);
    playDiceSound();

    const extraContent = await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, {
      wieldOutcome: game.i18n.localize("PB.Heal"),
      wieldRoll: roll,
      wieldFormula: "d6",
    });

    await actor.update({ "data.hp.value": Math.min(actor.data.data.hp.max, actor.data.data.hp.value + roll.total) });

    additionalContent = additionalContent.append(extraContent);
    needsToBeSaved = true;
  }

  if (data.isDamage && actor) {
    const damageRoll = await evaluateFormula(data.isCritical ? `(${data.damage}) * 2` : data.damage);
    const armorRoll = await evaluateFormula(data.armor);

    await showDice(wieldRoll);
    playDiceSound();

    const extraContent = await renderTemplate(WIELD_DAMAGE_CHAT_MESSAGE_TEMPLATE, {
      damageOutcome: `${game.i18n.localize("PB.Inflict")} ${Math.max(0, damageRoll.total - armorRoll.total)}  ${game.i18n.localize("PB.Damage")}`,
      damageRoll,
      armorRoll,
    });

    additionalContent = additionalContent.append(extraContent);
    needsToBeSaved = true;
  }

  if (needsToBeSaved) {
    messageContent = messageContent.find("form.roll-card").append(additionalContent).end();
    await message.update({
      content: messageContent.html(),
      sound: diceSound(),
    });

    const lastMessage = Array.from(ui.chat.collection).pop();
    if (lastMessage && lastMessage.id === message.id) {
      scrollChatToBottom();
      ui.chat.scrollBottom();
    }
  }
};
