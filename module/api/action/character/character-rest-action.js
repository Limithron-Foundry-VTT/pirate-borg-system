import { showGenericCard } from "../../../chat-message/generic-card.js";
import { showRestDialog } from "../../../dialog/rest-dialog.js";
import { createHealOutcome } from "../../outcome/actor/heal-outcome.js";
import { createInfectionOutcome } from "../../outcome/character/infection-outcome.js";
import { createStarvationOutcome } from "../../outcome/character/starvation-outcome.js";
import { characterExtraResourcePerDayAction } from "./character-extra-resource-per-day-action.js";
import { characterLuckPerDayAction } from "./character-luck-per-day-action.js";
import { characterRitualsPerDayAction } from "./character-rituals-per-day-action.js";

const REST_LENGTH = {
  SHORT: "short",
  LONG: "long",
};

const REST_FOOD_AND_DRINK = {
  EAT: "eat",
  STARVE: "starve",
  DONT_EAT: "donteat",
};

/**
 * @param {PBActor} actor
 * @returns {Promise.<ChatMessage>}
 */
export const characterRestAction = async (actor) => {
  const { restLength, foodAndDrink, infected } = await showRestDialog({
    actor: this,
  });

  switch (restLength) {
    case REST_LENGTH.SHORT:
      return await shortRest(actor, foodAndDrink, infected);
    case REST_LENGTH.LONG:
      return await longRest(actor, foodAndDrink, infected);
  }
};

/**
 * @param {String} foodAndDrink
 * @param {Boolean} infected
 * @returns {Boolean}
 */
const canRest = (foodAndDrink, infected) => ![REST_FOOD_AND_DRINK.STARVE, REST_FOOD_AND_DRINK.DONT_EAT].includes(foodAndDrink) && !infected;

/**
 * @param {PBActor} actor
 * @param {String} foodAndDrink
 * @param {Boolean} infected
 * @returns {Promise.<ChatMessage>}
 * @returns
 */
const shortRest = async (actor, foodAndDrink, infected) => {
  const isResting = canRest(foodAndDrink, infected);
  return await showGenericCard({
    actor,
    title: game.i18n.localize("PB.Rest"),
    description: !isResting ? game.i18n.localize("PB.NoEffect") : "",
    outcomes: isResting ? [await createHealOutcome({ actor, formula: "d4" })] : [],
  });
};

/**
 * @param {PBActor} actor
 * @param {String} foodAndDrink
 * @param {Boolean} infected
 * @returns {Promise.<Array<Outcome>}
 * @returns
 */
const longRest = async (actor, foodAndDrink, infected) => {
  const isResting = canRest(foodAndDrink, infected);
  const outcomes = [];

  if (foodAndDrink === REST_FOOD_AND_DRINK.STARVE) {
    outcomes.push(await createStarvationOutcome({ actor }));
  }

  if (infected) {
    outcomes.push(await createInfectionOutcome({ actor }));
  }

  if (isResting) {
    outcomes.push(await createHealOutcome({ actor, formula: "d8" }));
  }

  outcomes.push(await characterRitualsPerDayAction(actor, { silent: true }));

  if (actor.getUseExtraResource()) {
    outcomes.push(await characterExtraResourcePerDayAction(actor, { silent: true }));
  }

  if (actor.luck.value === 0) {
    outcomes.push(await characterLuckPerDayAction(actor, { silent: true }));
  }

  return await showGenericCard({
    actor,
    title: game.i18n.localize("PB.Rest"),
    outcomes,
  });
};
