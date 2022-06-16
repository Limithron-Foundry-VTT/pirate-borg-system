import { actorRollAbilityAction } from "../actor/actor-roll-ability-action.js";

export const characterRollAgilityAction = async (actor) => {
  const drModifiers = [];
  const armor = actor.equippedArmor();

  if (armor) {
    const armorTier = CONFIG.PB.armorTiers[armor.data.data.tier.max];
    if (armorTier.agilityModifier) {
      drModifiers.push(`${armor.name} (${game.i18n.localize("PB.DR")} + ${armorTier.agilityModifier})`);
    }
  }

  if (actor.isEncumbered()) {
    drModifiers.push(`${game.i18n.localize("PB.Encumbered")} (${game.i18n.localize("PB.DR")} + 2)`);
  }

  return await actorRollAbilityAction(actor, CONFIG.PB.abilityKey.agility, drModifiers);
};

export const characterRollStrengthAction = async (actor) => {
  const drModifiers = [];

  if (actor.isEncumbered()) {
    drModifiers.push(`${game.i18n.localize("PB.Encumbered")} (${game.i18n.localize("PB.DR")} + 2)`);
  }

  return await actorRollAbilityAction(actor, CONFIG.PB.abilityKey.strength, drModifiers);
};

export const characterRollPresenceAction = async (actor) => await actorRollAbilityAction(actor, CONFIG.PB.abilityKey.presence);

export const characterRollToughnessAction = async (actor) => await actorRollAbilityAction(actor, CONFIG.PB.abilityKey.toughness);

export const characterRollSpiritAction = async (actor) => await actorRollAbilityAction(actor, CONFIG.PB.abilityKey.spirit);
