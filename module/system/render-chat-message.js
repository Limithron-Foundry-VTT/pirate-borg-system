import { diceSound, showDice } from "../dice.js";
import { scrollChatToBottom } from "../sockets.js";

export const WIELD_ROLL_CHAT_MESSAGE_TEMPLATE = "systems/pirateborg/templates/chat/wield-roll.html";

export const renderChatMessage = async (message, html) => {
  html.on("click", "button.item-button", onChatCardAction.bind(this));
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

export const onChatCardAction = async (event) => {
  event.preventDefault();

  // Extract card data
  const button = event.currentTarget;
  let messageContent = $(button.closest(".message-content"));
  const messageId = button.closest(".message").dataset.messageId;
  const message = game.messages.get(messageId);
  const speaker = message.data.speaker;
  /** @type {PBActor|null} */
  const actor = ChatMessage.getSpeakerActor(speaker);
  /** @type {PBItem|null} */
  const item = actor?.items?.get(message.data.flags.itemId);
  const formula = button.dataset.formula;
  const wieldFormula = button.dataset.wieldFormula ?? formula;
  const wieldDR = button.dataset.dr ?? 10;

  const isFumble = !!button.dataset.isFumble;
  const isArcaneRitual = !!button.dataset.isArcaneRitual;
  const isAncientRelic = !!button.dataset.isAncientRelic;
  const isMysticalMishap = !!button.dataset.isMysticalMishap;
  button.remove();

  let needsToBeSaved = false;

  let additionalContent = $("<div>");

  if (isArcaneRitual && actor) {
    const rollResults = await wieldRoll(formula, wieldFormula, wieldDR, actor.getRollData());

    if (rollResults.isSuccess) {
      const newPowerUses = Math.max(0, actor.data.data.powerUses.value - 1);
      await actor.update({ ["data.powerUses.value"]: newPowerUses });
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

  if (isAncientRelic && actor) {
    const rollResults = await wieldRoll(formula, wieldFormula, wieldDR, actor.getRollData());

    if (!rollResults.isSuccess) {
      rollResults.wieldOutcomeText = game.i18n.localize(rollResults.isFumble ? "PB.InvokableRelicFumble" : "PB.InvokableRelicFailure");
    }

    const extraContent = await renderTemplate(WIELD_ROLL_CHAT_MESSAGE_TEMPLATE, rollResults);
    additionalContent = additionalContent.append(extraContent);

    needsToBeSaved = true;
  }

  if (isMysticalMishap && actor) {
    const mishapData = await actor.rollMysticalMishap(isFumble);
    await showDice(mishapData.roll);
    
    const extraContent = await renderTemplate("systems/pirateborg/templates/chat/mystical-mishap.html", mishapData);
    additionalContent = additionalContent.append(extraContent);

    needsToBeSaved = true;
  }

  if (needsToBeSaved) {
    messageContent = messageContent.find("form.roll-card").append(additionalContent).end();
    await message.update({
      content: messageContent.html(),
    });

    const lastMessage = Array.from(ui.chat.collection).pop();
    if (lastMessage && lastMessage.id === message.id) {
      scrollChatToBottom();
      ui.chat.scrollBottom();
    }
  }
};
