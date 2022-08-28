import { asyncPipe } from "../../../utils.js";
import { drawOutcome, withAsyncProps } from "../../outcome.js";
import { drawWeapon, findTableItems } from "../../../compendium.js";

/**
 * @return {Promise<Object>}
 */
export const createRollWeaponOutcome = async () => {
  const draw = await drawWeapon();
  const item = (await findTableItems(draw.results))[0];
  return asyncPipe(
    drawOutcome({ draw }),
    withAsyncProps({
      itemData: async () => item.toObject(false),
      description: () => game.i18n.format("PB.GetBetterLootWeapon", { link: item.link }),
    })
  )();
};
