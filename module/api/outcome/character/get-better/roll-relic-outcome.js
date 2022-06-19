import { drawRelic, findTableItems } from "../../../../compendium.js";
import { asyncPipe } from "../../../../utils.js";
import { drawOutcome, withAsyncProps } from "../../outcome.js";

export const createRollRelicOutcome = async () => {
  const draw = await drawRelic();
  const item = (await findTableItems(draw.results))[0];
  return asyncPipe(
    drawOutcome({ draw }),
    withAsyncProps({
      itemData: async () => item.data,
      description: () => game.i18n.format("PB.GetBetterLootRelic", { link: item.link }),
    }),
  )();
};
