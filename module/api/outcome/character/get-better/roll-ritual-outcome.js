import { drawRitual, findTableItems } from "../../../compendium.js";
import { asyncPipe } from "../../../utils.js";
import { drawOutcome, withAsyncProps } from "../../outcome.js";

/**
 * @return {Promise<Object>}
 */
export const createRollRitualOutcome = async () => {
  const draw = await drawRitual();
  const item = (await findTableItems(draw.results))[0];
  return asyncPipe(
    drawOutcome({ draw }),
    withAsyncProps({
      itemData: async () => item.data,
      description: () => game.i18n.format("PB.GetBetterLootRitual", { link: item.link }),
    })
  )();
};
