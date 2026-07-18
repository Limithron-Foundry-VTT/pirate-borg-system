import { showGenericCard } from "../../../chat-message/generic-card.js";
import { createDevilLuckInfoOutcome } from "../../outcome/character/devil-luck-info-outcome.js";

const DEVIL_LUCK_DESCRIPTION_TEMPLATE = "systems/pirateborg/templates/chat/devil-luck-information-card.html";

export const characterShowDevilLuckAction = async (actor) => {
  let description;
  if (game.release.generation >= 13) {
    description = await foundry.applications.handlebars.renderTemplate(DEVIL_LUCK_DESCRIPTION_TEMPLATE);
  } else {
    description = await renderTemplate(DEVIL_LUCK_DESCRIPTION_TEMPLATE);
  }

  const infoOutcome = await createDevilLuckInfoOutcome({ actor });

  return showGenericCard({
    actor,
    title: game.i18n.localize("PB.Luck"),
    description,
    outcomes: [infoOutcome],
  });
};
