import { actorRollAbilityAction } from "../actor/actor-roll-ability-action.js";

export const shipRollSkillAction = async (actor) => actorRollAbilityAction(actor, CONFIG.PB.ability.skill);

export const shipRollAgilityAction = async (actor) => actorRollAbilityAction(actor, CONFIG.PB.ability.agility);
