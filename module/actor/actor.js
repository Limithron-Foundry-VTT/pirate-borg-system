import CharacterGeneratorDialog from "../dialog/character-generator-dialog.js";
import ActorBaseClassDialog from "../dialog/actor-base-class-dialog.js";
import { rollAncientRelics, rollArcaneRituals, handleActorGettingBetterItems } from "../generator/character-generator.js";
import { isAutomaticDamageEnabled, isEnforceTargetEnabled, trackAmmo, trackCarryingCapacity } from "../system/settings.js";
import { showCrewActionDialog } from "../dialog/crew-action-dialog.js";
import { evaluateFormula, getTestOutcome } from "../utils.js";
import { showGenericCard } from "../chat-message/generic-card.js";
import { showGenericWieldCard } from "../chat-message/generic-wield-card.js";
import { BUTTON_ACTIONS, DAMAGE_TYPE } from "../system/render-chat-message.js";
import { drawBroken, drawDerelictTakesDamage, drawGunpowderFumble, drawReaction, executeCompendiumMacro, findCompendiumItem } from "../compendium.js";
import { executeMacro } from "../macro-helpers.js";
import { PBItem } from "../item/item.js";
import { showAttackDialog } from "../dialog/attack-dialog.js";
import { showDefendDialog } from "../dialog/defend-dialog.js";
import { emitDamageOnToken } from "../system/sockets.js";

const GET_BETTER_ROLL_CARD_TEMPLATE = "systems/pirateborg/templates/chat/get-better-roll-card.html";

/**
 * @extends {Actor}
 */
export class PBActor extends Actor {
  /** @override */
  static async create(data, options = {}) {
    mergeObject(data, CONFIG.PB.actorDefaults[data.type] || {}, { overwrite: false });
    return super.create(data, options);
  }

  /** @override */
  _onCreate(data, options, userId) {
    if (data.type === CONFIG.PB.actorTypes.character) {
      this._addDefaultClass();
    }
    super._onCreate(data, options, userId);
  }

  async _addDefaultClass() {
    const characterClass = this.getCharacterClass();
    if (!characterClass) {
      const defaultClass = await findCompendiumItem("pirateborg.class-landlubber", "Landlubber");
      await this.createEmbeddedDocuments("Item", [defaultClass.data]);
    }
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this._prepareItemsDerivedData();
    this.data.data.dynamic = this.data.data.dynamic ?? {};

    switch (this.type) {
      case CONFIG.PB.actorTypes.character:
        this._prepareCharacterDerivedData();
        break;
      case CONFIG.PB.actorTypes.container:
        this._prepareContainerDerivedData();
        break;
      case CONFIG.PB.actorTypes.vehicle:
      case CONFIG.PB.actorTypes.vehicle_npc:
        this._prepareVehicleDerivedData();
        break;
    }
  }

  _prepareItemsDerivedData() {
    this.items.forEach((item) => item.prepareActorItemDerivedData(this));
  }

  _prepareCharacterDerivedData() {
    this.data.data.dynamic.carryingWeight = this.carryingWeight();
    this.data.data.dynamic.carryingCapacity = this.normalCarryingCapacity();
    this.data.data.dynamic.encumbered = this.isEncumbered();
  }

  _prepareContainerDerivedData() {
    this.data.data.dynamic.containerSpace = this.containerSpace();
  }

  _prepareVehicleDerivedData() {
    this.data.data.attributes.cargo.value = this.cargoItems.length;
    if (this.data.data.weapons.broadsides.quantity > 1) {
      this.data.data.dynamic.hasBroadsidesPenalties = this.data.data.attributes.hp.value < this.data.data.attributes.hp.max - this.data.data.attributes.hp.max / this.data.data.weapons.broadsides.quantity;
    } else {
      this.data.data.dynamic.hasBroadsidesPenalties = false;
    }
    if (this.data.data.weapons.smallArms.quantity > 1) {
      this.data.data.dynamic.hasSmallArmsPenalties = this.data.data.attributes.hp.value < this.data.data.attributes.hp.max - this.data.data.attributes.hp.max / this.data.data.weapons.smallArms.quantity;
    } else {
      this.data.data.dynamic.hasSmallArmsPenalties = false;
    }
  }

  /** @override */
  async _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    if (this.type === CONFIG.PB.actorTypes.character && documents[0].type === CONFIG.PB.itemTypes.class) {
      await this.deleteEmbeddedDocuments(
        "Item",
        this.items
          .filter((item) => item.type === CONFIG.PB.itemTypes.class)
          .filter((item) => item.id !== documents[0].id)
          .map((item) => item.id)
      );
      await this.setBaseCharacterClass("");
    }
    await super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId);
  }

  /** @override */
  async _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    for (const document of documents) {
      if (document.isContainer) {
        await this.deleteEmbeddedDocuments("Item", document.items);
      }
      if (document.hasContainer) {
        document.container.removeItem(document.id);
      }
    }
    await super._onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId);
  }

  get attributes() {
    return this.data.data.attributes;
  }
  
  async setAttributes(value) {
    this.update({'data.attributes': value});
  }

  get hp() {
    return this.attributes.hp;
  }
  
  async setHp(value) {
    this.setAttributes({'hp': value});
  }

  /**
   * @returns {Boolean}
   */
  isCharacter() {
    return this.type === CONFIG.PB.actorTypes.character;
  }

  /**
   * @returns {Boolean}
   */  
  isVehicle() {
    return this.type === CONFIG.PB.actorTypes.vehicle;
  }

  /**
   * @returns {Boolean}
   */  
  isVehicleNpc() {
    return this.type === CONFIG.PB.actorTypes.vehicle_npc;
  }

  /**
   * @returns {Boolean}
   */  
  isAnyVehicle() {
    return this.isVehicle() || this.isVehicleNpc();
  }
  
  /**
   * @returns {PBItem}
   */
  equippedArmor() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.armor && item.equipped);
  }

  /**
   * @returns {PBItem}
   */  
  equippedHat() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.hat && item.equipped);
  }

  /**
   * @returns {PBItem}
  */
  firstEquippedWeapon() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.weapon && item.equipped);
  }

  /**
   * @param {PBItem} item
   * @returns {Promise}
   */  
  async equipItem(item) {
    if ([CONFIG.PB.itemTypes.armor, CONFIG.PB.itemTypes.hat].includes(item.type)) {
      await this.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_ARMOR, null);
      for (const otherItem of this.items) {
        if (otherItem.type === item.type && otherItem.id !== item.id) {
          await otherItem.unequip();
        }
      }
    }
    return await item.equip();
  }

  /**
   * @param {PBItem} item
   * @returns {Promise}
   */  
  async unequipItem(item) {
    return await item.unequip();
  }

  normalCarryingCapacity() {
    return this.data.data.abilities.strength.value + 8;
  }

  maxCarryingCapacity() {
    return 2 * this.normalCarryingCapacity();
  }

  carryingWeight() {
    return this.data.items
      .filter((item) => item.isEquipment && item.carried && !item.hasContainer)
      .filter((item) => !(item.isHat && item.equipped))
      .filter((item) => !(item.isArmor && item.equipped))
      .reduce((weight, item) => weight + item.totalCarryWeight, 0);
  }

  isEncumbered() {
    if (!trackCarryingCapacity()) {
      return false;
    }
    return this.carryingWeight() > this.normalCarryingCapacity();
  }

  containerSpace() {
    return this.data.items.filter((item) => item.isEquipment && !item.hasContainer).reduce((containerSpace, item) => containerSpace + item.totalSpace, 0);
  }

  async _testAbility(ability, abilityKey, abilityAbbrevKey, drModifiers = "") {
    const roll = await evaluateFormula(`1d20+@abilities.${ability}.value`, this.getRollData());
    await showGenericWieldCard({
      title: game.i18n.localize(abilityKey),
      actor: this,
      description: drModifiers,
      wieldFormula: `1d20 + ${game.i18n.localize(abilityAbbrevKey)}`,
      wieldRoll: roll,
    });
  }

  async testStrength() {
    const drModifiers = [];
    if (this.isEncumbered()) {
      drModifiers.push(`${game.i18n.localize("PB.Encumbered")}: ${game.i18n.localize("PB.DR")} +2`);
    }
    await this._testAbility("strength", "PB.AbilityStrength", "PB.AbilityStrengthAbbrev", drModifiers);
  }

  async testAgility() {
    const drModifiers = [];
    const armor = this.equippedArmor();
    if (armor) {
      const armorTier = CONFIG.PB.armorTiers[armor.data.data.tier.max];
      if (armorTier.agilityModifier) {
        drModifiers.push(`${armor.name}: ${game.i18n.localize("PB.DR")} +${armorTier.agilityModifier}`);
      }
    }
    if (this.isEncumbered()) {
      drModifiers.push(`${game.i18n.localize("PB.Encumbered")}: ${game.i18n.localize("PB.DR")} +2`);
    }
    await this._testAbility("agility", "PB.AbilityAgility", "PB.AbilityAgilityAbbrev", drModifiers);
  }

  async testPresence() {
    await this._testAbility("presence", "PB.AbilityPresence", "PB.AbilityPresenceAbbrev");
  }

  async testToughness() {
    await this._testAbility("toughness", "PB.AbilityToughness", "PB.AbilityToughnessAbbrev");
  }

  async testSpirit() {
    await this._testAbility("spirit", "PB.AbilitySpirit", "PB.AbilitySpiritAbbrev");
  }

  async testShipSkill() {
    await this._testAbility("skill", "PB.AbilitySkill", "PB.AbilitySkillAbbrev");
  }

  async testShipAgility() {
    await this._testAbility("agility", "PB.AbilityAgility", "PB.AbilityAgilityAbbrev");
  }

  async attack(itemId) {
    const weapon = this.items.get(itemId);
    
    if (!this._validateAttack(weapon)) { return }

    const { attackDR, targetArmor, targetToken } = await showAttackDialog({ actor: this });

    await this._handleWeaponReloading(weapon);
    await this._decrementWeaponAmmo(weapon);
    await this._rollAttack(weapon, attackDR, targetArmor, targetToken);
  }

  async _rollAttack(weapon, attackDR, targetArmor, targetToken) {
    const attackRoll = await evaluateFormula(`d20+@abilities.${weapon.attackAbility}.value`, this.getRollData());
    const testOutcome = getTestOutcome(attackRoll, attackDR, { fumbleOn: weapon.fumbleOn, critOn: weapon.critOn });
    const ammo = this.items.get(weapon.ammoId);

    console.log(targetToken, targetToken?.actor.name);

    const cardData = {
      wieldRoll: attackRoll,
      wieldFormula: `1d20 + ${game.i18n.localize(weapon.isRanged ? "PB.AbilityPresenceAbbrev" : "PB.AbilityStrengthAbbrev")}`,
      wieldDR: attackDR,
      testOutcome: testOutcome,
      title: `${game.i18n.localize(weapon.isRanged ? "PB.WeaponTypeRanged" : "PB.WeaponTypeMelee")} ${game.i18n.localize("PB.Attack")}`,
      items: [weapon],
      target: targetToken?.actor.name,
    };
    
    switch (testOutcome.outcome) {
      case CONFIG.PB.outcome.success:
        cardData.wieldOutcome = game.i18n.localize("PB.Hit");
        cardData.buttons = [
          {
            title: game.i18n.localize("PB.RollDamageButton"),
            data: {
              "action": BUTTON_ACTIONS.DAMAGE,
              "damage-type": DAMAGE_TYPE.INFLICT,
              "target-token-id": targetToken?.id,
              "armor": targetArmor,
              "damage": weapon.useAmmoDamage ? ammo.damageDie : weapon.damageDie,
              "damage-description": weapon.useAmmoDamage ? ammo.description : '',
            },
          },
        ];
        break;

      case CONFIG.PB.outcome.failure:
        cardData.wieldOutcome = game.i18n.localize("PB.Miss");
        break;

      case CONFIG.PB.outcome.critical_success:
        cardData.wieldOutcome = game.i18n.localize("PB.AttackCrit");
        cardData.wieldOutcomeDescription = game.i18n.localize("PB.AttackCritText");
        cardData.buttons = [
          {
            title: game.i18n.localize("PB.RollDamageButton"),
            data: {
              "action": BUTTON_ACTIONS.DAMAGE,
              "damage-type": DAMAGE_TYPE.INFLICT,
              "target-token-id": targetToken?.id,
              "armor": targetArmor,
              "is-critical": testOutcome.isCriticalSuccess,
              "damage": weapon.useAmmoDamage ? ammo.damageDie : weapon.damageDie,
              "damage-description": weapon.useAmmoDamage ? ammo.description : '',
              "crit-extra-damage": weapon.critExtraDamage,
            },
          },
        ];
        break;

      case CONFIG.PB.outcome.fumble:
        cardData.wieldOutcome = game.i18n.localize("PB.AttackFumble");
        if (weapon.isGunpowderWeapon) {
          cardData.wieldOutcomeDescription = await drawGunpowderFumble();
        } else {
          cardData.wieldOutcomeDescription = game.i18n.localize("PB.AttackFumbleText");
        }
        break;
    }

    if (ammo) {
      cardData.items.push(ammo);
    } else if (weapon.usesAmmo) {
      cardData.items.push(new PBItem({ type: "ammo", name: game.i18n.localize("PB.NoAmmo") }));
    }

    await showGenericWieldCard({
      actor: this,
      ...cardData,
    });
  }

  /**
   * @param {PBItem} weapon 
   * @returns {Boolean}
   */
  _validateAttack(weapon) {
    if (!this._isAmmoValid(weapon)) {
      ui.notifications.error(game.i18n.format("PB.NoAmmoEquipped"));
      return false;
    }

    if (!this._isTargetsValid(weapon)) {
      ui.notifications.error(game.i18n.format("PB.InvalidTarget"));
      return false;
    }
    return true;
  }

  /**
   * @param {PBItem} weapon 
   * @returns {Boolean}
   */  
  _isAmmoValid(weapon) {
    if (!weapon.useAmmoDamage) { return true }
    if (!weapon.hasAmmo) { return false }
    return true;
  }

  /**
   * @param {PBItem} weapon 
   * @returns {Boolean}
   */  
  _isTargetsValid(weapon) {
    if (!this.isInCombat()) { return true }
    if (!isEnforceTargetEnabled()) { return true }
    if (game.user.targets.size !== 1) { return false }  
    return true;
  }

  /**
   * @returns {Boolean}
   */    
  isInCombat() {
    return (game.combats.active?.combatants ?? []).some(combatant => combatant.actor.id === this.id);
  }

  async _handleWeaponReloading(weapon) {
    if (!weapon?.data?.data?.needsReloading) {
      return;
    }
    const reloadTime = weapon.data.data.reloadTime || 1;
    await weapon.update({
      "data.loadingCount": reloadTime,
    });
  }

  async _decrementWeaponAmmo(weapon) {
    if (weapon.usesAmmo && weapon.ammoId && trackAmmo()) {
      const ammo = this.items.get(weapon.ammoId);
      if (ammo) {
        const quantity = ammo.quantity - 1;
        if (quantity > 0) {
          ammo.setQuantity(quantity);
        } else {
          await this.deleteEmbeddedDocuments("Item", [ammo.id]);
        }
      }
    }
  }

  async defend() {
    const { defendArmor, defendDR, incomingAttack, targetToken } = await showDefendDialog({ actor: this });
    await this._rollDefend(defendArmor, defendDR, incomingAttack, targetToken);
  }

  async _rollDefend(defendArmor, defendDR, incomingAttack, targetToken) {
    const defenseRoll = await evaluateFormula(`d20+@abilities.agility.value`, this.getRollData());
    const testOutcome = getTestOutcome(defenseRoll, defendDR);
    const hat = this.equippedHat();
    const cardData = {
      wieldRoll: defenseRoll,
      wieldFormula: `1d20 + ${game.i18n.localize("PB.AbilityAgilityAbbrev")}`,
      wieldDR: defendDR,
      title: game.i18n.localize("PB.Defend"),
      testOutcome: testOutcome,
      target: targetToken?.actor.name,
      items: [this.equippedArmor(), this.equippedHat()].filter((item) => item),
    };

    switch (testOutcome.outcome) {
      case CONFIG.PB.outcome.success:
        cardData.wieldOutcome = game.i18n.localize("PB.Dodge");
        break;

      case CONFIG.PB.outcome.failure:
        cardData.wieldOutcome = game.i18n.localize("PB.YouAreHit");
        cardData.buttons = [
          {
            title: game.i18n.localize("PB.RollDamageButton"),
            data: {
              "action": BUTTON_ACTIONS.DAMAGE,
              "damage-type": DAMAGE_TYPE.TAKE,
              "target-token-id": targetToken?.id,
              "armor": defendArmor + (hat?.data.data.reduceDamage ? " + 1" : ""),
              "damage": incomingAttack,
            },
          },
        ];
        break;

      case CONFIG.PB.outcome.critical_success:
        cardData.wieldOutcome = game.i18n.localize("PB.DefendCrit");
        cardData.wieldOutcomeDescription = game.i18n.localize("PB.DefendCritText");
        break;

      case CONFIG.PB.outcome.fumble:
        cardData.wieldOutcome = game.i18n.localize("PB.AttackFumble");
        cardData.wieldOutcomeDescription = game.i18n.localize("PB.DefendFumbleText");
        cardData.buttons = [
          {
            title: game.i18n.localize("PB.RollDamageButton"),
            data: {
              "action": BUTTON_ACTIONS.DAMAGE,
              "damage-type": DAMAGE_TYPE.TAKE,
              "target-token-id": targetToken?.id,
              "armor": defendArmor + (hat?.data.data.reduceDamage ? " + 1" : ""),
              "damage": incomingAttack,
              "is-critical": testOutcome.isFumble,
            },
          },
        ];
        break;
    }

    await showGenericWieldCard({
      actor: this,
      ...cardData,
    });
  }

  /**
   * Increments the items reload counter.
   * @param {string} itemId
   */
  async reload(itemId) {
    const item = this.items.get(itemId);
    const reloadTime = item.data.data.reloadTime || 1;
    if (!item.data.data.needsReloading) {
      return;
    }

    let loadingCount = item.data.data.loadingCount || 0;
    loadingCount--;
    if (loadingCount <= 0) {
      loadingCount = 0;
    }

    await showGenericCard({
      actor: this,
      title: item.name,
      description: game.i18n.format("PB.Reloading", {
        current: reloadTime - loadingCount || 1,
        max: reloadTime || 1,
      }),
    });

    await item.update({
      "data.loadingCount": loadingCount,
    });
  }

  async checkMorale() {
    if (!this.data.data.attributes.morale || this.data.data.attributes.morale === "-") {
      ui.notifications.warn(`Creature don't have a morale value!`);
      return;
    }

    const moraleRoll = await evaluateFormula("2d6");
    const wieldData = {};

    if (this.data.data.attributes.morale && moraleRoll.total > this.data.data.attributes.morale) {
      const outcomeRoll = await evaluateFormula("1d6");
      wieldData.secondaryWieldRoll = outcomeRoll;
      wieldData.secondaryWieldFormula = outcomeRoll.formula;
      wieldData.wieldOutcome = outcomeRoll.total <= 3 ? game.i18n.localize("PB.MoraleFlees") : game.i18n.localize("PB.MoraleSurrenders");
    } else {
      wieldData.wieldOutcome = game.i18n.localize("PB.StandsFirm");
    }

    await showGenericWieldCard({
      title: game.i18n.localize("PB.Morale"),
      actor: this,
      wieldFormula: moraleRoll.formula,
      wieldRoll: moraleRoll,
      ...wieldData,
    });
  }

  async checkReaction() {
    const result = await drawReaction();
    await showGenericWieldCard({
      title: game.i18n.localize("PB.Reaction"),
      actor: this,
      wieldOutcome: result.results.map((r) => r.data.text),
      wieldFormula: result.roll.formula,
      wieldRoll: result.roll,
    });
  }

  async invokeInvokable(itemId) {
    const item = this.items.get(itemId);
    if (!item || !item.data.data.invokableType) {
      return;
    }

    switch (item.data.data.invokableType) {
      case "Arcane Ritual":
        await this.invokeArcaneRitual(item);
        break;
      case "Ancient Relic":
        await this.invokeAncientRelic(item);
        break;
      default:
        await this.invokeExtraResource(item);
        break;
    }
  }

  async invokeExtraResource(item) {
    if (this.data.data.attributes.extraResource.value < 1) {
      ui.notifications.error(`${game.i18n.format("PB.NoResourceUsesRemaining", { type: item.data.data.invokableType })}!`);
      return;
    }

    const characterClass = this.getCharacterClass();
    const wieldFormulaLabel =
      characterClass.data.data.extraResourceTestFormulaLabel || (await this.getCharacterBaseClass()).data?.data.extraResourceTestFormulaLabel;
    const formula = characterClass.data.data.extraResourceTestFormula || (await this.getCharacterBaseClass()).data?.data.extraResourceTestFormula;

    await showGenericCard({
      actor: this,
      title: item.name,
      description: item.data.data.description,
      buttons: [
        {
          title: game.i18n.localize("PB.Invoke"),
          data: {
            formula: formula,
            "wield-formula": wieldFormulaLabel,
            dr: 12,
            action: BUTTON_ACTIONS.EXTRA_RESOURCE,
          },
        },
      ],
    });

    await this.useActionMacro(item.id);
  }

  async invokeAncientRelic(item) {
    await showGenericCard({
      actor: this,
      title: item.name,
      description: item.data.data.description,
      buttons: [
        {
          title: game.i18n.localize("PB.TestRelic"),
          data: {
            formula: "d20+@abilities.spirit.value",
            "wield-formula": `1d20 + ${game.i18n.localize("PB.AbilitySpiritAbbrev")}`,
            dr: 12,
            action: BUTTON_ACTIONS.ANCIENT_RELIC,
          },
        },
      ],
    });
    await this.useActionMacro(item.id);
  }

  async invokeArcaneRitual(item) {
    if (this.data.data.attributes.rituals.value < 1) {
      ui.notifications.error(`${game.i18n.localize("PB.NoPowerUsesRemaining")}!`);
      return;
    }

    await showGenericCard({
      actor: this,
      title: item.name,
      description: item.data.data.description,
      buttons: [
        {
          title: game.i18n.localize("PB.InvokeRitual"),
          data: {
            formula: "d20+@abilities.spirit.value",
            "wield-formula": `1d20 + ${game.i18n.localize("PB.AbilitySpiritAbbrev")}`,
            dr: 12,
            action: BUTTON_ACTIONS.ARCANE_RITUAL,
          },
        },
      ],
    });

    await this.useActionMacro(item.id);
  }

  async useActionMacro(itemId) {
    const item = this.items.get(itemId);
    if (!item || !item.data.data.actionMacro) {
      return;
    }
    const [compendium, macroName = null] = item.data.data.actionMacro.split(";");
    if (compendium && macroName) {
      const macro = await findCompendiumItem(compendium, macroName);
      await executeMacro(macro, { actor: this, item });
    } else {
      const macro = game.macros.find((m) => m.name === macroName);
      await executeMacro(macro, { actor: this, item });
    }
  }

  async rollLuck() {
    if (!this.getCharacterClass()) {
      return;
    }
    const roll = await evaluateFormula("@luckDie", { luckDie: await this.getLuckDie() });
    await showGenericWieldCard({
      actor: this,
      title: game.i18n.localize("PB.Luck"),
      wieldFormula: roll.formula,
      wieldRoll: roll,
    });
    const newLuck = Math.max(0, roll.total);
    await this.update({ ["data.attributes.luck"]: { max: newLuck, value: newLuck } });
  }

  async rollRitualPerDay() {
    const roll = await evaluateFormula("d4+@abilities.spirit.value", this.getRollData());
    await showGenericWieldCard({
      actor: this,
      title: `${game.i18n.localize("PB.RitualRemaining")} ${game.i18n.localize("PB.PerDay")}`,
      wieldFormula: game.i18n.localize("PB.RitualPerday"),
      wieldRoll: roll,
    });
    const newUses = Math.max(0, roll.total);
    await this.update({ "data.attributes.rituals": { max: newUses, value: newUses } });
  }

  async rollExtraResourcePerDay() {
    const characterClass = this.getCharacterClass();
    const baseClass = await this.getCharacterBaseClass();
    if (characterClass.data.data.useExtraResource || baseClass.data?.data.useExtraResource) {
      const roll = await evaluateFormula(characterClass.data.data.extraResourceFormula || baseClass.data?.data.extraResourceFormula, this.getRollData());
      await showGenericWieldCard({
        actor: this,
        title: `${characterClass.data.data.extraResourceNamePlural || baseClass.data?.data.extraResourceNamePlural} ${game.i18n.localize("PB.PerDay")}`,
        wieldFormula: characterClass.data.data.extraResourceFormulaLabel || baseClass.data?.data.extraResourceFormulaLabel,
        wieldRoll: roll,
      });
      const newUses = Math.max(0, roll.total);
      await this.update({ "data.attributes.extraResource": { max: newUses, value: newUses } });
    }
  }

  /**
   *
   * @param {*} restLength "short" or "long"
   * @param {*} foodAndDrink "eat", "donteat", or "starve"
   * @param {*} infected true/false
   */
  async rest(restLength, foodAndDrink, infected) {
    if (restLength === "short") {
      if (foodAndDrink === "eat" && !infected) {
        await this.rollHealHitPoints("d4");
      } else {
        await this.showRestNoEffect();
      }
    } else if (restLength === "long") {
      let canRestore = true;
      if (foodAndDrink === "starve") {
        await this.rollStarvation();
        canRestore = false;
      }
      if (infected) {
        await this.rollInfection();
        canRestore = false;
      }
      if (canRestore && foodAndDrink === "eat") {
        await this.rollHealHitPoints("d8");
        await this.rollRitualPerDay();
        await this.rollExtraResourcePerDay();
        if (this.data.data.attributes.luck.value === 0) {
          await this.rollLuck();
        }
      } else if (canRestore && foodAndDrink === "donteat") {
        await this.showRestNoEffect();
      }
    }
  }

  async showRestNoEffect() {
    await showGenericCard({
      actor: this,
      title: game.i18n.localize("PB.Rest"),
      description: game.i18n.localize("PB.NoEffect"),
    });
  }

  async rollHealHitPoints(dieRoll) {
    const roll = await evaluateFormula(dieRoll, this.getRollData());
    await showGenericWieldCard({
      actor: this,
      title: game.i18n.localize("PB.Rest"),
      wieldFormula: dieRoll,
      wieldRoll: roll,
      wieldOutcome: `${game.i18n.localize("PB.Heal")} ${roll.total} ${game.i18n.localize("PB.HP")}`,
    });
    const newHP = Math.min(this.data.data.attributes.hp.max, this.data.data.attributes.hp.value + roll.total);
    await this.update({ ["data.attributes.hp.value"]: newHP });
  }

  async rollStarvation() {
    const roll = await evaluateFormula("d4");
    await showGenericWieldCard({
      actor: this,
      title: game.i18n.localize("PB.Starvation"),
      wieldFormula: "d4",
      wieldRoll: roll,
      wieldOutcome: `${game.i18n.localize("PB.Take")} ${roll.total} ${game.i18n.localize("PB.Damage")}`,
    });
    const newHP = this.data.data.attributes.hp.value - roll.total;
    await this.update({ ["data.attributes.hp.value"]: newHP });
  }

  async rollInfection() {
    const roll = await evaluateFormula("d6");
    await showGenericWieldCard({
      actor: this,
      title: game.i18n.localize("PB.Infection"),
      wieldFormula: "d6",
      wieldRoll: roll,
      wieldOutcome: `${game.i18n.localize("PB.Take")} ${roll.total} ${game.i18n.localize("PB.Damage")}`,
    });
    const newHP = this.data.data.attributes.hp.value - roll.total;
    await this.update({ ["data.attributes.hp.value"]: newHP });
  }

  async getBetter() {
    const oldHp = this.data.data.attributes.hp.max;
    const newHp = await this._betterHp(oldHp);
    const oldStr = this.data.data.abilities.strength.value;
    const newStr = await this._betterAbility(oldStr);
    const oldAgi = this.data.data.abilities.agility.value;
    const newAgi = await this._betterAbility(oldAgi);
    const oldPre = this.data.data.abilities.presence.value;
    const newPre = await this._betterAbility(oldPre);
    const oldTou = this.data.data.abilities.toughness.value;
    const newTou = await this._betterAbility(oldTou);
    const oldSpi = this.data.data.abilities.spirit.value;
    const newSpi = await this._betterAbility(oldSpi);
    let newSilver = this.data.data.silver;

    const hpOutcome = await this._abilityOutcome(game.i18n.localize("PB.HP"), oldHp, newHp);
    const strOutcome = await this._abilityOutcome(game.i18n.localize("PB.AbilityStrength"), oldStr, newStr);
    const agiOutcome = await this._abilityOutcome(game.i18n.localize("PB.AbilityAgility"), oldAgi, newAgi);
    const preOutcome = await this._abilityOutcome(game.i18n.localize("PB.AbilityPresence"), oldPre, newPre);
    const touOutcome = await this._abilityOutcome(game.i18n.localize("PB.AbilityToughness"), oldTou, newTou);
    const spiOutcome = await this._abilityOutcome(game.i18n.localize("PB.AbilitySpirit"), oldSpi, newSpi);

    // Left in the debris you find...
    let debrisOutcome = null;
    let relicOrRitual = null;
    const debrisRoll = await evaluateFormula("1d6", this.getRollData());
    if (debrisRoll.total < 4) {
      debrisOutcome = "Nothing";
    } else if (debrisRoll.total === 4) {
      const silverRoll = await evaluateFormula("3d10", this.getRollData());
      debrisOutcome = `${silverRoll.total} silver`;
      newSilver += silverRoll.total;
    } else if (debrisRoll.total === 5) {
      debrisOutcome = "an ancient relic";
      relicOrRitual = (await rollAncientRelics())[0];
    } else {
      debrisOutcome = "an arcane ritual";
      relicOrRitual = (await rollArcaneRituals())[0];
    }

    const gettingBetterItems = await handleActorGettingBetterItems(this);
    const gettingBetterItemsData = gettingBetterItems.map((item) => item.data);

    const data = {
      hpOutcome,
      agiOutcome,
      preOutcome,
      strOutcome,
      touOutcome,
      spiOutcome,
      debrisOutcome,
      relicOrRitual: relicOrRitual ? relicOrRitual.data : null,
      classFeatures: gettingBetterItemsData,
    };

    const html = await renderTemplate(GET_BETTER_ROLL_CARD_TEMPLATE, data);
    ChatMessage.create({
      content: html,
      sound: CONFIG.sounds.dice, // make a single dice sound
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });

    if (relicOrRitual) {
      await this.createEmbeddedDocuments("Item", [relicOrRitual.data], { render: false });
    }

    // set new stats on the actor
    await this.update({
      ["data.abilities.strength.value"]: newStr,
      ["data.abilities.agility.value"]: newAgi,
      ["data.abilities.presence.value"]: newPre,
      ["data.abilities.toughness.value"]: newTou,
      ["data.abilities.spirit.value"]: newSpi,
      ["data.attributes.hp.max"]: newHp,
      ["data.silver"]: newSilver,
    });

    await this.invokeGettingBetterMacro();
  }

  async _betterHp(oldHp) {
    const hpRoll = await evaluateFormula("6d10", this.getRollData());
    if (hpRoll.total >= oldHp) {
      // success, increase HP
      const howMuchRoll = await evaluateFormula("1d6", this.getRollData());
      return oldHp + howMuchRoll.total;
    } else {
      // no soup for you
      return oldHp;
    }
  }

  async _betterAbility(oldVal) {
    const roll = await evaluateFormula("1d6", this.getRollData());
    if (roll.total === 1 || roll.total < oldVal) {
      // decrease, to a minimum of -3
      return Math.max(-3, oldVal - 1);
    } else {
      // increase, to a max of +6
      return Math.min(6, oldVal + 1);
    }
  }

  async _abilityOutcome(abilityName, oldVal, newVal) {
    if (newVal < oldVal) {
      return `Lose ${oldVal - newVal} ${abilityName}`;
    } else if (newVal > oldVal) {
      return `Gain ${newVal - oldVal} ${abilityName}`;
    } else {
      return `${abilityName} unchanged`;
    }
  }

  async regenerateCharacter() {
    new CharacterGeneratorDialog(this).render(true);
  }

  async showBaseClassDialog() {
    new ActorBaseClassDialog(this).render(true);
  }

  async rollBroken() {
    const draw = await drawBroken();
    await showGenericWieldCard({
      actor: this,
      title: game.i18n.localize("PB.Broken"),
      wieldFormula: draw.roll.formula,
      wieldRoll: draw.roll,
      wieldOutcomeDescription: draw.results.map((r) => r.data.text),
    });
  }

  getCharacterClass() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.class);
  }

  async setBaseCharacterClass(baseClass) {
    await this.update({ ["data.baseClass"]: baseClass });
  }

  async getCharacterBaseClass() {
    const [compendium, item] = this.data.data.baseClass.split(";");
    if (compendium && item) {
      const baseClass = await findCompendiumItem(compendium, item);
      return baseClass;
    }
  }

  async getLuckDie() {
    const currentClass = this.getCharacterClass();
    const baseClass = await this.getCharacterBaseClass();
    if (!baseClass && !currentClass) {
      // Use the default from the template
      return null;
    }
    return baseClass ? baseClass.data.data.luckDie : currentClass.data.data.luckDie;
  }

  // Ships

  get cargoItems() {
    return this.items.filter((item) => item.type === CONFIG.PB.itemTypes.cargo);
  }

  get broadsidesDie() {
    return this.data.data.weapons?.broadsides.die;
  }

  get smallArmsDie() {
    return this.data.data.weapons?.smallArms.die;
  }

  get ramDie() {
    return this.data.data.weapons?.ram.die;
  }

  get captain() {
    return this.data.data.captain;
  }

  async setCaptain(actorId) {
    return await this.update({ "data.captain": actorId });
  }

  get shanties() {
    return this.data.data.attributes.shanties;
  }

  async setShanties({ value, max }) {
    return await this.update({ "data.attributes.shanties": { max: value, value: max } });
  }

  get crews() {
    return this.data.data.crews || [];
  }

  async setCrews(crews) {
    return await this.update({ "data.crews": crews });
  }

  async addCrew(actorId) {
    if (!this.crews.includes(actorId)) {
      return await this.setCrews([...this.crews, actorId]);
    }
  }

  async removeCrew(actorId) {
    const crews = this.crews.filter((crew) => crew !== actorId);
    if (this.captain === actorId) {
      await this.setCaptain(null);
    }
    return await this.setCrews(crews);
  }

  async clearCrews() {
    await this.setCaptain(null);
    return await this.setCrews([]);
  }

  async rotateToken(angle) {
    const token = this.token || game.scenes.current.tokens.find((token) => token.actor.id === this.id);
    if (token) {
      const currentRotation = token.data.rotation;
      await token.update({ rotation: currentRotation + angle });
    }
  }

  async rollShipSink() {
    const result = await drawDerelictTakesDamage();
    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipSinking"),
      actor: this,
      wieldOutcome: game.i18n.localize("PB.ShipSinkingMessage"),
      wieldFormula: result.roll.formula,
      wieldRoll: result.roll,
      wieldOutcomeDescription: result.results.map((r) => r.data.text),
    });
  }

  async rollMysticShantiesPerDay() {
    const captain = game.actors.get(this.captain);
    const roll = await evaluateFormula("@mysticShantiesDie + @captain.abilities.spirit.value", {
      mysticShantiesDie: "d4",
      captain: captain?.getRollData(),
    });

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipMysticShanties"),
      actor: this,
      wieldFormula: "d4 + Captain Spirit",
      wieldRoll: roll,
    });

    await this.setShanties({ max: Math.max(0, roll.total), value: Math.max(0, roll.total) });
  }

  async invokeShanties(item) {
    if (this.shanties.value < 1) {
      ui.notifications.error(`${game.i18n.localize("PB.ShipNoShantiesUsesRemaining")}!`);
      return;
    }

    await showGenericCard({
      title: item.name,
      actor: this,
      description: item.data.data.description,
      buttons: [
        {
          title: game.i18n.localize("PB.TestShanties"),
          data: {
            formula: "d20",
            "wield-formula": `1d20 + ${game.i18n.localize("PB.AbilitySpiritAbbrev")}`,
            dr: 12,
            action: BUTTON_ACTIONS.SHANTIES,
          },
        },
      ],
    });

    await this.useActionMacro(item.id);
  }

  _shipActionOutcomeText(testOutcome) {
    switch (testOutcome.outcome) {
      case CONFIG.PB.outcome.fumble:
        return game.i18n.localize("PB.OutcomeFumble");
      case CONFIG.PB.outcome.critical_success:
        return game.i18n.localize("PB.OutcomeCriticalSuccess");
      case CONFIG.PB.outcome.success:
        return game.i18n.localize("PB.OutcomeSuccess");
      case CONFIG.PB.outcome.failure:
        return game.i18n.localize("PB.OutcomeFailure");
    }
  }

  async doBroadsidesAction(isPCAction) {
    const {
      selectedActor,
      selectedDR: wieldDR,
      selectedArmor,
    } = await showCrewActionDialog({
      actor: this,
      title: game.i18n.localize("PB.ShipCrewActionBroadsides"),
      description: game.i18n.localize("PB.ShipBroadsidesMessage"),
      enableCrewSelection: isPCAction,
      enableDrSelection: true,
      enableArmorSelection: true,
    });

    const wieldFormula = selectedActor ? "d20 + Crew Skill + PC Presence" : "d20 + Crew Skill";
    const formula = selectedActor ? "d20 + @abilities.skill.value + @crew.abilities.presence.value" : "d20 + @abilities.skill.value";
    const wieldRoll = await evaluateFormula(formula, { ...this.getRollData(), crew: selectedActor ? selectedActor.getRollData() : {} });
    const testOutcome = getTestOutcome(wieldRoll, wieldDR);
    const buttons = testOutcome.isSuccess
      ? [
          {
            title: game.i18n.localize("PB.RollDamageButton"),
            data: {
              action: BUTTON_ACTIONS.DAMAGE,
              "damage-type": DAMAGE_TYPE.INFLICT,
              armor: selectedArmor,
              "is-critical": testOutcome.isCriticalSuccess,
              damage: this.broadsidesDie,
            },
          },
        ]
      : [];
    const wieldOutcomeDescription = testOutcome.isCriticalSuccess
      ? game.i18n.localize("PB.ShipDealDamageCritical")
      : testOutcome.isFumble
      ? game.i18n.localize("PB.ShipDealDamageFumble")
      : "";

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipCrewActionBroadsides"),
      description: game.i18n.localize("PB.ShipBroadsidesMessage"),
      actor: this,
      wieldDR,
      wieldFormula,
      wieldRoll,
      buttons,
      wieldOutcomeDescription,
      wieldOutcome: this._shipActionOutcomeText(testOutcome),
    });
  }

  async doSmallArmsAction(isPCAction) {
    const {
      selectedActor,
      selectedDR: wieldDR,
      selectedArmor,
    } = await showCrewActionDialog({
      actor: this,
      title: game.i18n.localize("PB.ShipCrewActionSmallArms"),
      description: game.i18n.localize("PB.ShipSmallArmsMessage"),
      enableCrewSelection: isPCAction,
      enableDrSelection: true,
      enableArmorSelection: true,
    });

    const wieldFormula = selectedActor ? "d20 + Crew Skill + PC Presence" : "d20 + Crew Skill";
    const formula = selectedActor ? "d20 + @abilities.skill.value + @crew.abilities.presence.value" : "d20 + @abilities.skill.value";
    const wieldRoll = await evaluateFormula(formula, { ...this.getRollData(), crew: selectedActor ? selectedActor.getRollData() : {} });
    const testOutcome = getTestOutcome(wieldRoll, wieldDR);
    const buttons = testOutcome.isSuccess
      ? [
          {
            title: game.i18n.localize("PB.RollDamageButton"),
            data: {
              action: BUTTON_ACTIONS.DAMAGE,
              "damage-type": DAMAGE_TYPE.INFLICT,
              armor: selectedArmor,
              "is-critical": testOutcome.isCriticalSuccess,
              damage: this.smallArmsDie,
            },
          },
        ]
      : [];
    const wieldOutcomeDescription = testOutcome.isCriticalSuccess
      ? game.i18n.localize("PB.ShipDealDamageCritical")
      : testOutcome.isFumble
      ? game.i18n.localize("PB.ShipDealDamageFumble")
      : "";

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipCrewActionSmallArms"),
      description: game.i18n.localize("PB.ShipSmallArmsMessage"),
      actor: this,
      wieldDR,
      wieldFormula,
      wieldRoll,
      buttons,
      wieldOutcomeDescription,
      wieldOutcome: this._shipActionOutcomeText(testOutcome),
    });
  }

  async doRamAction() {
    const { selectedArmor, selectedMovement } = await showCrewActionDialog({
      actor: this,
      title: game.i18n.localize("PB.ShipCrewActionRam"),
      description: game.i18n.localize("PB.ShipRamMessage"),
      enableArmorSelection: true,
      enableMovementSelection: true,
    });

    const damageRoll = await evaluateFormula(`${this.ramDie} + ${selectedMovement}`);
    const armorRoll = await evaluateFormula(selectedArmor);
    const damageOutcome = `${game.i18n.localize("PB.Inflict")} ${Math.max(0, damageRoll.total - armorRoll.total)}  ${game.i18n.localize("PB.Damage")}`;

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipCrewActionRam"),
      description: game.i18n.localize("PB.ShipRamMessage"),
      actor: this,
      damageOutcome,
      damageRoll,
      armorRoll,
    });
  }

  async doFullSailAction(isPCAction) {
    const { selectedActor, selectedDR: wieldDR } = await showCrewActionDialog({
      actor: this,
      title: game.i18n.localize("PB.ShipCrewActionFullSail"),
      description: game.i18n.localize("PB.ShipFullSailMessage"),
      enableCrewSelection: isPCAction,
      enableDrSelection: true,
    });

    const wieldFormula = selectedActor ? "d20 + Ship Agility + PC Agility" : "d20 + Ship Agility";
    const formula = selectedActor ? "d20 + @abilities.agility.value + @crew.abilities.agility.value" : "d20 + @abilities.agility.value";
    const wieldRoll = await evaluateFormula(formula, { ...this.getRollData(), crew: selectedActor ? selectedActor.getRollData() : {} });
    const testOutcome = getTestOutcome(wieldRoll, wieldDR);

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipCrewActionFullSail"),
      description: game.i18n.localize("PB.ShipFullSailMessage"),
      actor: this,
      wieldDR,
      wieldFormula,
      wieldRoll,
      wieldOutcome: this._shipActionOutcomeText(testOutcome),
    });
  }

  async doComeAboutAction(isPCAction) {
    const { selectedActor, selectedDR: wieldDR } = await showCrewActionDialog({
      actor: this,
      title: game.i18n.localize("PB.ShipCrewActionComeAbout"),
      description: game.i18n.localize("PB.ShipComeAboutMessage"),
      enableCrewSelection: isPCAction,
      enableDrSelection: true,
    });

    const wieldFormula = selectedActor ? "d20 + Ship Agility + PC Strength" : "d20 + Ship Agility";
    const formula = selectedActor ? "d20 + @abilities.agility.value + @crew.abilities.strength.value" : "d20 + @abilities.agility.value";
    const wieldRoll = await evaluateFormula(formula, { ...this.getRollData(), crew: selectedActor ? selectedActor.getRollData() : {} });
    const testOutcome = getTestOutcome(wieldRoll, wieldDR);

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipCrewActionComeAbout"),
      description: game.i18n.localize("PB.ShipComeAboutMessage"),
      actor: this,
      wieldDR,
      wieldFormula,
      wieldRoll,
      wieldOutcome: this._shipActionOutcomeText(testOutcome),
    });
  }

  async doRepairAction(isPCAction) {
    const canHeal = this.data.data.attributes.hp.value < this.data.data.attributes.hp.max / 2;
    const { selectedActor, selectedDR: wieldDR } = await showCrewActionDialog({
      actor: this,
      enableCrewSelection: isPCAction && canHeal,
      enableDrSelection: true && canHeal,
      title: game.i18n.localize("PB.ShipCrewActionRepair"),
      description: game.i18n.localize("PB.ShipRepairMessage"),
      canSubmit: canHeal,
    });

    const wieldFormula = selectedActor ? "d20 + Crew Skill + PC Presence" : "d20 + Crew Skill";
    const formula = selectedActor ? "d20 + @abilities.skill.value + @crew.abilities.presence.value" : "d20 + @abilities.skill.value";
    const wieldRoll = await evaluateFormula(formula, { ...this.getRollData(), crew: selectedActor ? selectedActor.getRollData() : {} });
    const testOutcome = getTestOutcome(wieldRoll, wieldDR);
    const buttons = testOutcome.isSuccess ? [{ title: game.i18n.localize("PB.ShipRepairButton"), data: { action: BUTTON_ACTIONS.REPAIR_CREW_ACTION } }] : [];

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipCrewActionRepair"),
      description: game.i18n.localize("PB.ShipRepairMessage"),
      actor: this,
      wieldDR,
      wieldFormula,
      wieldRoll,
      wieldOutcome: this._shipActionOutcomeText(testOutcome),
      buttons,
    });
  }

  async _showBasicCrewActionDialog({ title, description } = {}) {
    await showCrewActionDialog({
      actor: this,
      title: title,
      description: description,
    });
    await showGenericCard({
      actor: this,
      title: title,
      description: description,
    });
  }

  async doBoardingPartyAction() {
    await this._showBasicCrewActionDialog({
      title: game.i18n.localize("PB.ShipCrewActionBoardingParty"),
      description: game.i18n.localize("PB.ShipBoardingPartyMessage"),
    });
  }

  async doDropAnchorAction() {
    await this._showBasicCrewActionDialog({
      title: game.i18n.localize("PB.ShipCrewActionDropAnchor"),
      description: game.i18n.localize("PB.ShipDropAnchorMessage"),
    });
  }

  async doWeighAnchorAction() {
    await this._showBasicCrewActionDialog({
      title: game.i18n.localize("PB.ShipCrewActionWeighAnchor"),
      description: game.i18n.localize("PB.ShipWeighAnchorMessage"),
    });
  }

  async invokeStartingMacro() {
    const cls = this.getCharacterClass();
    await executeCompendiumMacro(cls.data.data.startingMacro, { actor: this, item: cls });
    const baseClass = await this.getCharacterBaseClass();
    if (baseClass) {
      await executeCompendiumMacro(baseClass.data.data.startingMacro, { actor: this, item: baseClass });
    }
  }

  async invokeGettingBetterMacro() {
    const cls = this.getCharacterClass();
    await executeCompendiumMacro(cls.data.data.gettingBetterMacro, { actor: this, item: cls });
    const baseClass = await this.getCharacterBaseClass();
    if (baseClass) {
      await executeCompendiumMacro(baseClass.data.data.gettingBetterMacro, { actor: this, item: baseClass });
    }
  }

  /**
   * @param {Actor} actor 
   * @param {Number} damage 
   */
  async takeActorDamage(actor, damage) {
    console.log(`${this.name} take ${this.scaleDamageFromSource(actor, damage)} damages from ${actor?.name}`)
    if (isAutomaticDamageEnabled()) {
      this.setHp({value: this.hp.value - this.scaleDamageFromSource(actor, damage)})
    }
  }

  /**
   * @param {Actor} actor 
   * @param {Number} damage 
   */
  async inflictActorDamage(actor, damage) {
    for(const target of game.user.targets)  {
      if (game.user.isGM) {
        await target.actor.takeActorDamage(actor, damage);
      } else {
        emitDamageOnToken(target.id, actor.id, damage);
      }
    }    
  }

  scaleDamageFromSource(source, damage) {    
     if (source.isAnyVehicle() && this.isCharacter()) {
      return damage * 5;
    } else if (this.isAnyVehicle() && source.isCharacter()) {
      return Math.round(damage / 5);
    } else {
      return damage;
    }
  }

  /**
   * @returns {String}
   */
  getArmorFormula() {
    switch (this.type) {
      case CONFIG.PB.actorTypes.character:
        const equippedArmor = this.equippedArmor();
        return equippedArmor ? CONFIG.PB.armorTiers[equippedArmor.tier.value].damageReductionDie : 0;
      case CONFIG.PB.actorTypes.vehicle_npc:
      case CONFIG.PB.actorTypes.vehicle:
        return CONFIG.PB.armorTiers[this.attributes.hull.value].damageReductionDie;
      case CONFIG.PB.actorTypes.creature:
        return this.attributes.armor.formula;
      case CONFIG.PB.actorTypes.container:
        return 0;
    }
  }
  /**
   * @returns {String}
   */
  getAttackFormula() {
    console.log(this.type)
    switch (this.type) {
      case CONFIG.PB.actorTypes.character:
        return this.firstEquippedWeapon()?.damageDie ?? "1d2";
      case CONFIG.PB.actorTypes.creature:
        return this.attributes.attack.formula;
      case CONFIG.PB.actorTypes.vehicle_npc:
      case CONFIG.PB.actorTypes.vehicle:
        return "1d2";        
      case CONFIG.PB.actorTypes.container:
        return 0;
    }
  }
}
