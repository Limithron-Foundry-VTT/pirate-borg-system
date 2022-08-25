import { actorRollAbilityAction } from "../actor/actor-roll-ability-action.js";

export const characterRollAgilityAction = async (actor) => {
  const drModifiers = [];
  const armor = actor.equippedArmor;

  if (armor) {
    const armorTier = CONFIG.PB.armorTiers[armor.tier.max];
    if (armorTier.agilityModifier) {
      drModifiers.push(`${armor.name} (${game.i18n.localize("PB.DR")} + ${armorTier.agilityModifier})`);
    }
  }

  if (actor.isEncumbered) {
    drModifiers.push(`${game.i18n.localize("PB.Encumbered")} (${game.i18n.localize("PB.DR")} + 2)`);
  }

  return actorRollAbilityAction(actor, CONFIG.PB.ability.agility, drModifiers);
};

export const characterRollStrengthAction = async (actor) => {
  const drModifiers = [];

  if (actor.isEncumbered) {
    drModifiers.push(`${game.i18n.localize("PB.Encumbered")} (${game.i18n.localize("PB.DR")} + 2)`);
  }

  return actorRollAbilityAction(actor, CONFIG.PB.ability.strength, drModifiers);
};

export const characterRollPresenceAction = async (actor) => actorRollAbilityAction(actor, CONFIG.PB.ability.presence);

export const characterRollToughnessAction = async (actor) => actorRollAbilityAction(actor, CONFIG.PB.ability.toughness);

export const characterRollSpiritAction = async (actor) => actorRollAbilityAction(actor, CONFIG.PB.ability.spirit);
