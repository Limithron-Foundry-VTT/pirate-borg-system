import CharacterGeneratorDialog from "../dialog/character-generator-dialog.js";
import ActorBaseClassDialog from "../dialog/actor-base-class-dialog.js";
import { rollAncientRelics, rollArcaneRituals, handleActorGettingBetterItems } from "../generator/character-generator.js";
import { trackAmmo, trackCarryingCapacity } from "../system/settings.js";
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
    switch (this.type) {
      case CONFIG.PB.actorTypes.character:
        this._prepareCharacterDerivedData();
        break;
      case CONFIG.PB.actorTypes.container:
        this._prepareContainerDerivedData();
        break;
      case CONFIG.PB.actorTypes.vehicle:
      case CONFIG.PB.actorTypes.vehicle_creature:
        this._prepareVehicleDerivedData();
        break;
    }
  }

  _prepareItemsDerivedData() {
    this.items.forEach((item) => item.prepareActorItemDerivedData(this));
  }

  _prepareCharacterDerivedData() {
    this.data.data.carryingWeight = this.carryingWeight();
    this.data.data.carryingCapacity = this.normalCarryingCapacity();
    this.data.data.encumbered = this.isEncumbered();
  }

  _prepareContainerDerivedData() {
    this.data.data.containerSpace = this.containerSpace();
  }

  _prepareVehicleDerivedData() {
    this.data.data.cargo.value = this.cargoItems.length;
    if (this.data.data.broadsidesQuantity > 1) {
      this.data.data.hasBroadsidesPenalties = this.data.data.hp.value < this.data.data.hp.max - this.data.data.hp.max / this.data.data.broadsidesQuantity;
    } else {
      this.data.data.hasBroadsidesPenalties = false;
    }
    if (this.data.data.broadsidesQuantity > 1) {
      this.data.data.hasSmallArmsPenalties = this.data.data.hp.value < this.data.data.hp.max - this.data.data.hp.max / this.data.data.smallArmsQuantity;
    } else {
      this.data.data.hasSmallArmsPenalties = false;
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

  equippedArmor() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.armor && item.equipped);
  }

  equippedHat() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.hat && item.equipped);
  }

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
    const isValid = this._validate(weapon);
    if (isValid) {
      const { attackDR, targetArmor } = await showAttackDialog({ actor: this });
      await this._handleWeaponReloading(weapon);
      await this._decrementWeaponAmmo(weapon);
      await this._rollAttack(weapon, attackDR, targetArmor);
    }
  }

  async _rollAttack(weapon, attackDR, targetArmor) {
    const attackRoll = await evaluateFormula(`d20+@abilities.${weapon.attackAbility}.value`, this.getRollData());
    const testOutcome = getTestOutcome(attackRoll, attackDR, { fumbleOn: weapon.fumbleOn, critOn: weapon.critOn });
    const ammo = this.items.get(weapon.ammoId);

    const cardData = {
      wieldRoll: attackRoll,
      wieldFormula: `1d20 + ${game.i18n.localize(weapon.isRanged ? "PB.AbilityPresenceAbbrev" : "PB.AbilityStrengthAbbrev")}`,
      wieldDR: attackDR,
      title: `${game.i18n.localize(weapon.isRanged ? "PB.WeaponTypeRanged" : "PB.WeaponTypeMelee")} ${game.i18n.localize("PB.Attack")}`,
      items: [weapon],
    };

    switch (testOutcome.outcome) {
      case CONFIG.PB.outcome.success:
        cardData.wieldOutcome = game.i18n.localize("PB.Hit");
        cardData.buttons = [
          {
            title: game.i18n.localize("PB.RollDamageButton"),
            data: {
              action: BUTTON_ACTIONS.DAMAGE,
              damageType: DAMAGE_TYPE.INFLICT,
              armor: targetArmor,
              damage: weapon.useAmmoDamage ? weapon.useAmmoDamage : weapon.damageDie,
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
              action: BUTTON_ACTIONS.DAMAGE,
              damageType: DAMAGE_TYPE.INFLICT,
              armor: targetArmor,
              "is-critical": testOutcome.isCriticalSuccess,
              damage: weapon.useAmmoDamage ? ammo.damageDie : weapon.damageDie,
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

  _validate(weapon) {
    if (weapon.useAmmoDamage && !weapon.hasAmmo) {
      ui.notifications.error(game.i18n.format("PB.NoAmmoEquipped"));
      return false;
    }
    return true;
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
          ammo.quantity = quantity;
        } else {
          await this.deleteEmbeddedDocuments("Item", [ammo.id]);
        }
      }
    }
  }

  async defend() {
    const { defendArmor, defendDR, incomingAttack } = await showDefendDialog({ actor: this });
    console.log(defendArmor, defendDR, incomingAttack);
    await this._rollDefend(defendArmor, defendDR, incomingAttack);
  }

  async _rollDefend(defendArmor, defendDR, incomingAttack) {
    const defenseRoll = await evaluateFormula(`d20+@abilities.agility.value`, this.getRollData());
    const testOutcome = getTestOutcome(defenseRoll, defendDR);
    const hat = this.equippedHat();
    const cardData = {
      wieldRoll: defenseRoll,
      wieldFormula: `1d20 + ${game.i18n.localize("PB.AbilityAgilityAbbrev")}`,
      wieldDR: defendDR,
      title: game.i18n.localize("PB.Defend"),
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
              action: BUTTON_ACTIONS.DAMAGE,
              damageType: DAMAGE_TYPE.TAKE,
              armor: defendArmor + (hat?.data.data.reduceDamage ? " + 1" : ""),
              damage: incomingAttack,
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
              action: BUTTON_ACTIONS.DAMAGE,
              damageType: DAMAGE_TYPE.TAKE,
              armor: defendArmor + (hat?.data.data.reduceDamage ? " + 1" : ""),
              damage: incomingAttack,
              "is-critical": testOutcome.isFumble,
            },
          },
        ];
        break;
    }
    console.log(cardData);
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
    const moraleRoll = await evaluateFormula("2d6");
    const wieldData = {};

    if (this.data.data.morale && moraleRoll.total > this.data.data.morale) {
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
    if (this.data.data.extraResourceUses.value < 1) {
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
    if (this.data.data.powerUses.value < 1) {
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
    await this.update({ ["data.luck"]: { max: newLuck, value: newLuck } });
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
    await this.update({ "data.powerUses": { max: newUses, value: newUses } });
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
      await this.update({ "data.extraResourceUses": { max: newUses, value: newUses } });
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
        if (this.data.data.luck.value === 0) {
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
    const newHP = Math.min(this.data.data.hp.max, this.data.data.hp.value + roll.total);
    await this.update({ ["data.hp.value"]: newHP });
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
    const newHP = this.data.data.hp.value - roll.total;
    await this.update({ ["data.hp.value"]: newHP });
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
    const newHP = this.data.data.hp.value - roll.total;
    await this.update({ ["data.hp.value"]: newHP });
  }

  async getBetter() {
    const oldHp = this.data.data.hp.max;
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
      ["data.hp.max"]: newHp,
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

  async scvmify() {
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
    return this.data.data.broadsidesDie;
  }

  get smallArmsDie() {
    return this.data.data.smallArmsDie;
  }

  get ramDie() {
    return this.data.data.ramDie;
  }

  get captain() {
    return this.data.data.captain;
  }

  async setCaptain(actorId) {
    return await this.update({ "data.captain": actorId });
  }

  get shanties() {
    return this.data.data.shanties;
  }

  async setShanties({ value, max }) {
    return await this.update({ "data.shanties": { max: value, value: max } });
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

  _shipActionOutcomeText(rollOutcome) {
    switch (rollOutcome.outcome) {
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
    const rollOutcome = getTestOutcome(wieldRoll, wieldDR);
    const buttons = rollOutcome.isSuccess
      ? [
          {
            title: game.i18n.localize("PB.RollDamageButton"),
            data: {
              action: BUTTON_ACTIONS.DAMAGE,
              armor: selectedArmor,
              "is-critical": rollOutcome.isCriticalSuccess,
              damage: this.broadsidesDie,
            },
          },
        ]
      : [];
    const wieldOutcomeDescription = rollOutcome.isCriticalSuccess
      ? game.i18n.localize("PB.ShipDealDamageCritical")
      : rollOutcome.isFumble
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
      wieldOutcome: this._shipActionOutcomeText(rollOutcome),
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
    const rollOutcome = getTestOutcome(wieldRoll, wieldDR);
    const buttons = rollOutcome.isSuccess
      ? [
          {
            title: game.i18n.localize("PB.RollDamageButton"),
            data: {
              action: BUTTON_ACTIONS.DAMAGE,
              armor: selectedArmor,
              "is-critical": rollOutcome.isCriticalSuccess,
              damage: this.smallArmsDie,
            },
          },
        ]
      : [];
    const wieldOutcomeDescription = rollOutcome.isCriticalSuccess
      ? game.i18n.localize("PB.ShipDealDamageCritical")
      : rollOutcome.isFumble
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
      wieldOutcome: this._shipActionOutcomeText(rollOutcome),
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
    const rollOutcome = getTestOutcome(wieldRoll, wieldDR);

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipCrewActionFullSail"),
      description: game.i18n.localize("PB.ShipFullSailMessage"),
      actor: this,
      wieldDR,
      wieldFormula,
      wieldRoll,
      wieldOutcome: this._shipActionOutcomeText(rollOutcome),
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
    const rollOutcome = getTestOutcome(wieldRoll, wieldDR);

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipCrewActionComeAbout"),
      description: game.i18n.localize("PB.ShipComeAboutMessage"),
      actor: this,
      wieldDR,
      wieldFormula,
      wieldRoll,
      wieldOutcome: this._shipActionOutcomeText(rollOutcome),
    });
  }

  async doRepairAction(isPCAction) {
    const canHeal = this.data.data.hp.value < this.data.data.hp.max / 2;
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
    const rollOutcome = getTestOutcome(wieldRoll, wieldDR);
    const buttons = rollOutcome.isSuccess ? [{ title: game.i18n.localize("PB.ShipRepairButton"), data: { action: BUTTON_ACTIONS.REPAIR_CREW_ACTION } }] : [];

    await showGenericWieldCard({
      title: game.i18n.localize("PB.ShipCrewActionRepair"),
      description: game.i18n.localize("PB.ShipRepairMessage"),
      actor: this,
      wieldDR,
      wieldFormula,
      wieldRoll,
      wieldOutcome: this._shipActionOutcomeText(rollOutcome),
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
}
