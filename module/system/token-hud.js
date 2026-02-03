import { isTokenHUDShowStatusDetailsEnabled } from "./settings.js";

export const alterTokenHUDStatusEffects = (tokenHUD) => {
  if (!isTokenHUDShowStatusDetailsEnabled()) return;

  // Handle conflicts with Monk's Little Details
  if (game.MonksLittleDetails?.canDo("alter-hud") && game.settings.get("monks-little-details", "alter-hud")) return;

  const statusEffectContainer = tokenHUD.querySelector(".col.right .status-effects");
  if (!statusEffectContainer) return;

  statusEffectContainer.classList.add("expanded-details");

  const statusEffects = statusEffectContainer.querySelectorAll(".effect-control");
  statusEffects.forEach((statusEffect) => {
    const statusId = statusEffect.dataset.statusId || statusEffect.dataset.condition;
    const condition = CONFIG.statusEffects.find((se) => se.id === statusId);
    const title = condition?.name ? game.i18n.localize(condition.name) : statusEffect.dataset.tooltipText || statusEffect.title;

    const wrapper = document.createElement("div");
    wrapper.className = "status-effect-container";
    const titleNode = document.createElement("span");
    titleNode.className = "status-effect-title";
    titleNode.innerText = title;

    statusEffect.replaceWith(wrapper);
    wrapper.appendChild(statusEffect);
    wrapper.appendChild(titleNode);
  });
};
