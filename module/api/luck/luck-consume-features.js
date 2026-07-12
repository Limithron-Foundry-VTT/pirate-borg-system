import { drawDeckOfCards, drawJokerTable } from "../compendium.js";
import { asyncPipe, getResultText } from "../utils.js";
import { drawOutcome, withTarget } from "../outcome/outcome.js";

const LUCKY_DEVIL_ID = "sYUKPmVVlxHlrNMC";

const FACE_RANKS = {
  ace: 14,
  king: 13,
  queen: 12,
  jack: 11,
  ten: 10,
  nine: 9,
  eight: 8,
  seven: 7,
  six: 6,
  five: 5,
  four: 4,
  three: 3,
  two: 2,
};

const handlers = [];

export const registerLuckConsumeFeature = ({ id, match, execute }) => {
  if (handlers.some((handler) => handler.id === id)) {
    return;
  }
  handlers.push({ id, match, execute });
};

export const runLuckConsumeFeatures = async (actor) => {
  const outcomes = [];
  for (const item of actor.items) {
    for (const handler of handlers) {
      if (handler.match(item)) {
        outcomes.push(...(await handler.execute({ actor, item })));
      }
    }
  }
  return outcomes;
};

export const parsePlayingCardRank = (text) => {
  if (!text) return null;
  if (/joker/i.test(text)) return "joker";
  const rank = text.match(/^(\w+)\s+of\s+/i)?.[1]?.toLowerCase();
  return FACE_RANKS[rank] ?? null;
};

const isLuckyDevilItem = (item) => {
  if (item.name === "Lucky Devil" || item.id === LUCKY_DEVIL_ID || item._id === LUCKY_DEVIL_ID) {
    return true;
  }
  const sourceId = item._stats?.compendiumSource ?? item.flags?.core?.sourceId ?? "";
  return String(sourceId).includes(LUCKY_DEVIL_ID);
};

const applyJokerTableLuck = async (actor, total) => {
  if (total >= 2 && total <= 9) await actor.updateLuck({ value: 0 });
  else if (total >= 10 && total <= 19) await actor.updateLuck({ value: (actor.luck?.value || 0) + 2 });
  else if (total === 20) await actor.updateLuck({ value: Math.min(4, (actor.luck?.value || 0) + 4) });
};

export const executeLuckyDevil = async ({ actor, item }) => {
  const draw = await drawDeckOfCards();
  const cardText = (draw.results ?? [])
    .map((result) => getResultText(result))
    .filter(Boolean)
    .join(" ");
  const rank = parsePlayingCardRank(cardText);

  let cardOutcome = await asyncPipe(
    drawOutcome({
      type: "lucky-devil-card",
      title: item.name,
      draw,
    }),
    withTarget({ actor }),
  )();

  const outcomes = [];

  if (rank === "joker") {
    outcomes.push(cardOutcome);
    const jokerDraw = await drawJokerTable();
    const jokerOutcome = await asyncPipe(
      drawOutcome({
        type: "joker-table",
        title: game.i18n.localize("PB.JokerTable"),
        draw: jokerDraw,
      }),
      withTarget({ actor }),
    )();
    outcomes.push(jokerOutcome);
    await applyJokerTableLuck(actor, jokerDraw.roll.total);
    return outcomes;
  }

  if (typeof rank === "number") {
    const quantity = item.system?.quantity ?? 1;
    const threshold = Math.max(2, 9 - (quantity - 1));
    if (rank >= threshold) {
      await actor.updateLuck({ value: (actor.luck?.value || 0) + 1 });
      cardOutcome = {
        ...cardOutcome,
        description: `${cardOutcome.description ?? ""}<p>${game.i18n.localize("PB.LuckyDevilRegain")}</p>`,
      };
    }
  }

  outcomes.push(cardOutcome);
  return outcomes;
};

registerLuckConsumeFeature({
  id: "lucky-devil",
  match: isLuckyDevilItem,
  execute: executeLuckyDevil,
});
