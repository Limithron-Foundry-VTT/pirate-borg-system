import { asyncPipe } from "../../utils.js";
import { rollOutcome } from "../outcome.js";

/**
 * @param {PBActor} actor
 * @return {Promise<Object>}
 */
export const createInitiativeOutcome = async ({ actor }) =>
  asyncPipe(
    rollOutcome({
      type: "initiative",
      title: game.i18n.localize("PB.Initiative"),
      formula: `d6+@abilities.agility.value${actor.attributes?.combat?.initiativeModifier ? "+@attributes.combat.initiativeModifier" : ""}`,
      formulaLabel: `${game.i18n.localize("PB.InitiativeFormula")}${
        actor.attributes?.combat?.initiativeModifier ? ` + ${game.i18n.localize("PB.InitiativeBonus")} (${actor._getInitiativeEffectDetails()})` : ""
      }`,
      data: actor.getRollData(),
    })
  )();
