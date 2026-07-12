import { showDiceWithSound } from "../../dice.js";
import { characterConsumeLuckAction } from "../character/character-consume-luck-action.js";

export const chatConsumeLuckButtonAction = async (originalOutcome) => {
  const initiatorToken = canvas.ready ? canvas.tokens?.get(originalOutcome.initiatorToken) : null;
  const initiatorActor = initiatorToken?.actor ?? game.actors.get(originalOutcome.initiatorActor);
  if (!initiatorActor) {
    return null;
  }

  const outcomes = await characterConsumeLuckAction(initiatorActor);
  if (!Array.isArray(outcomes)) {
    return null;
  }

  const rolls = outcomes.map((outcome) => outcome.roll).filter((roll) => roll);
  if (rolls.length) {
    await showDiceWithSound(rolls);
  }

  return outcomes;
};
