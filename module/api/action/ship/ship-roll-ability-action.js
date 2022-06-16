import { actorRollAbilityAction } from "../actor/actor-roll-ability-action.js";

export const shipRollSkillAction = async (actor) => await actorRollAbilityAction(actor, CONFIG.PB.abilityKey.skill);

export const shipRollAgilityAction = async (actor) => await actorRollAbilityAction(actor, CONFIG.PB.abilityKey.agility);
