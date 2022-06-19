import { trackCarryingCapacity } from "../system/settings.js";
import { setSystemFlag } from "../utils.js";
import { findCompendiumItem } from "../compendium.js";
import { executeMacro } from "../macros.js";

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
  async _onCreate(data, options, userId) {
    if (data.type === CONFIG.PB.actorTypes.character) {
      if (!this.characterClass) {
        const defaultClass = await findCompendiumItem("pirateborg.class-landlubber", "Landlubber");
        await this.createEmbeddedDocuments("Item", [defaultClass.data]);
      }
    }
    await super._onCreate(data, options, userId);
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this._prepareItemsDerivedData();

    this.getData().dynamic = this.getData().dynamic ?? {};

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

  async _prepareCharacterDerivedData() {
    this.dynamic.carryingWeight = this.carryingWeight;
    this.dynamic.carryingCapacity = this.normalCarryingCapacity;
    this.dynamic.encumbered = this.isEncumbered;

    this.dynamic.useExtraResource = this.characterClass?.useExtraResource || this.characterBaseClass?.useExtraResource;
    this.dynamic.extraResourceNamePlural = this.characterClass?.extraResourceNamePlural || this.characterBaseClass?.extraResourceNamePlural;
    this.dynamic.extraResourceNameSingular = this.characterClass?.extraResourceNameSingular || this.characterBaseClass?.extraResourceNameSingular;
    this.dynamic.extraResourceFormula = this.characterClass?.extraResourceFormula || this.characterBaseClass?.extraResourceFormula;
    this.dynamic.extraResourceFormulaLabel = this.characterClass?.extraResourceFormulaLabel || this.characterBaseClass?.extraResourceFormulaLabel;
    this.dynamic.extraResourceTestFormula = this.characterClass?.extraResourceTestFormula || this.characterBaseClass?.extraResourceTestFormula;
    this.dynamic.extraResourceTestFormulaLabel = this.characterClass?.extraResourceTestFormulaLabel || this.characterBaseClass?.extraResourceTestFormulaLabel;

    this.dynamic.luckDie = this.characterClass?.luckDie || this.characterBaseClass?.luckDie;
  }

  async _prepareContainerDerivedData() {
    this.dynamic.containerSpace = this.containerSpace;
  }

  async _prepareVehicleDerivedData() {
    this.attributes.cargo.value = this.cargoItems.length;
    if (this.weapons.broadsides.quantity > 1) {
      this.dynamic.hasBroadsidesPenalties = this.attributes.hp.value < this.attributes.hp.max - this.attributes.hp.max / this.weapons.broadsides.quantity;
    } else {
      this.dynamic.hasBroadsidesPenalties = false;
    }
    if (this.weapons.smallArms.quantity > 1) {
      this.dynamic.hasSmallArmsPenalties = this.attributes.hp.value < this.attributes.hp.max - this.attributes.hp.max / this.weapons.smallArms.quantity;
    } else {
      this.dynamic.hasSmallArmsPenalties = false;
    }
  }

  /** @override */
  async _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    if (this.type === CONFIG.PB.actorTypes.character && documents[0].type === CONFIG.PB.itemTypes.class) {
      console.log(documents[0].isBaseClass);
      await this.deleteEmbeddedDocuments(
        "Item",
        this.items
          .filter((item) => item.type === CONFIG.PB.itemTypes.class)
          .filter((item) => !documents[0].isBaseClass ? true : item.isBaseClass === documents[0].isBaseClass)
          .filter((item) => item.id !== documents[0].id)
          .map((item) => item.id),
      );
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

  /** V10 */
  getData() {
    return this.system ?? this.data.data;
  }

  async updateData(key, value) {
    await this.update({ [`data.${key}`]: value });
  }

  // actor type properties
  /**
   * @returns {Boolean}
   */
  get isCharacter() {
    return this.type === CONFIG.PB.actorTypes.character;
  }

  /**
   * @returns {Boolean}
   */
  get isCreature() {
    return this.type === CONFIG.PB.actorTypes.creature;
  }

  /**
   * @returns {Boolean}
   */
  get isVehicle() {
    return this.type === CONFIG.PB.actorTypes.vehicle;
  }

  /**
   * @returns {Boolean}
   */
  get isVehicleNpc() {
    return this.type === CONFIG.PB.actorTypes.vehicle_npc;
  }

  /**
   * @returns {Boolean}
   */
  get isAnyVehicle() {
    return this.isVehicle || this.isVehicleNpc;
  }

  // common
  get attributes() {
    return this.getData().attributes;
  }

  async updateAttributes(value) {
    await this.updateData("attributes", value);
  }

  get abilities() {
    return this.getData().abilities;
  }

  async updateAbilities(value) {
    await this.updateData("abilities", value);
  }
  
  get dynamic() {
    return this.getData().dynamic;
  }

  get hp() {
    return this.attributes.hp;
  }

  async updateHp(value) {
    await this.updateAttributes({ hp: value });
  }

  // characters
  get silver() {
    return this.getData().silver;
  }

  async updateSilver(value) {
    await this.updateData("silver", value);
  }

  get luck() {
    return this.attributes.luck;
  }

  async updateLuck(value) {
    await this.updateAttributes({ luck: value });
  }

  get rituals() {
    return this.attributes.rituals;
  }

  async updateRituals(value) {
    await this.updateAttributes({ rituals: value });
  }

  get extraResource() {
    return this.attributes.extraResource;
  }

  async updateExtraResource(value) {
    await this.updateAttributes({ extraResource: value });
  }

  // Creature
  get morale() {
    return this.attributes.morale;
  }

  // extra character properties
  get luckDie() {
    return this.dynamic.luckDie;
  }

  get useExtraResource() {
    return this.dynamic.useExtraResource;
  }

  get extraResourceNameSingular() {
    return this.dynamic.extraResourceNameSingular;
  }

  get extraResourceNamePlural() {
    return this.dynamic.extraResourceNamePlural;
  }

  get extraResourceFormula() {
    return this.dynamic.extraResourceFormula;
  }

  get extraResourceFormulaLabel() {
    return this.dynamic.extraResourceFormulaLabel;
  }

  get extraResourceTestFormula() {
    console.log(this.dynamic, this.dynamic.extraResourceTestFormula);
    return this.dynamic.extraResourceTestFormula;
  }

  get extraResourceTestFormulaLabel() {
    return this.dynamic.extraResourceTestFormulaLabel;
  }

  /**
   * @returns {PBItem}
   */
  get characterClass() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.class && item.isBaseClass !== true);
  }

  /**
   * @returns {PBItem}
   */
  get characterBaseClass() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.class && item.isBaseClass === true);
  }

  /**
   * @returns {PBItem}
   */
  get equippedArmor() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.armor && item.equipped);
  }

  /**
   * @returns {PBItem}
   */
  get equippedHat() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.hat && item.equipped);
  }

  /**
   * @returns {PBItem}
   */
  get firstEquippedWeapon() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.weapon && item.equipped);
  }

  get normalCarryingCapacity() {
    return this.abilities.strength.value + 8;
  }

  get maxCarryingCapacity() {
    return 2 * this.normalCarryingCapacity;
  }

  get carryingWeight() {
    return this.data.items
      .filter((item) => item.isEquipment && item.carried && !item.hasContainer)
      .filter((item) => !(item.isHat && item.equipped))
      .filter((item) => !(item.isArmor && item.equipped))
      .reduce((weight, item) => weight + item.totalCarryWeight, 0);
  }

  get isEncumbered() {
    if (!trackCarryingCapacity()) {
      return false;
    }
    return this.carryingWeight > this.normalCarryingCapacity;
  }

  get containerSpace() {
    return this.data.items.filter((item) => item.isEquipment && !item.hasContainer).reduce((containerSpace, item) => containerSpace + item.totalSpace, 0);
  }

  /**
   * @returns {Boolean}
   */
  get isInCombat() {
    return (game.combats.active?.combatants ?? []).some((combatant) => combatant.actor.id === this.id);
  }

  // Ships
  get cargoItems() {
    return this.items.filter((item) => item.type === CONFIG.PB.itemTypes.cargo);
  }

  get weapons() {
    return this.getData().weapons;
  }

  get broadsidesDie() {
    return this.weapons?.broadsides.die;
  }

  get smallArmsDie() {
    return this.weapons?.smallArms.die;
  }

  get ramDie() {
    return this.weapons?.ram.die;
  }

  get captain() {
    return this.getData().captain;
  }

  async setCaptain(actorId) {
    return await this.updateData("captain", actorId);
  }

  get shanties() {
    return this.attributes.shanties;
  }

  async updateShanties(value) {
    await this.updateAttributes({ shanties: value });
  }

  get crews() {
    return this.getData().crews || [];
  }

  async updateCrews(crews) {
    return await this.updateData("crews", crews);
  }

  // crew management
  async addCrew(actorId) {
    if (!this.crews.includes(actorId)) {
      return await this.updateCrews([...this.crews, actorId]);
    }
  }

  async removeCrew(actorId) {
    const crews = this.crews.filter((crew) => crew !== actorId);
    if (this.captain === actorId) {
      await this.setCaptain(null);
    }
    return await this.updateCrews(crews);
  }

  async clearCrews() {
    await this.setCaptain(null);
    return await this.updateCrews([]);
  }

  /**
   * @param {PBItem} item
   * @returns {Promise}
   */
  async equipItem(item) {
    if ([CONFIG.PB.itemTypes.armor, CONFIG.PB.itemTypes.hat].includes(item.type)) {
      await setSystemFlag(this, CONFIG.PB.flags.DEFEND_ARMOR, null);
      const items = this.items.filter((otherItem) => otherItem.type === item.type).filter((otherItem) => otherItem.id !== item.id);
      for (const otherItem of items) {
        await otherItem.unequip();
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

  async setBaseClass(baseClass)  {
    const [compendium, item] = baseClass.split(";");
    if (compendium && item) {
      const baseClassItem = await findCompendiumItem(compendium, item);
      baseClassItem.isBaseClass = true;
      await this.createEmbeddedDocuments("Item", [baseClassItem.toObject(false)]);
    }
  }
  /**
   * @returns {String}
   */
  getActorArmorFormula() {
    switch (this.type) {
      case CONFIG.PB.actorTypes.character:
        return this.equippedArmor?.damageReductionDie ?? 0;
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
  getActorAttackFormula() {
    switch (this.type) {
      case CONFIG.PB.actorTypes.character:
        return this.firstEquippedWeapon?.damageDie ?? "1d2";
      case CONFIG.PB.actorTypes.creature:
        return this.attributes.attack.formula;
      case CONFIG.PB.actorTypes.vehicle_npc:
      case CONFIG.PB.actorTypes.vehicle:
        return "1d8";
      case CONFIG.PB.actorTypes.container:
        return 0;
    }
  }

  /**
   * @param {PBActor} actor
   * @param {PBActor} targetActor
   * @param {String} damageFormula
   * @returns {String}
   */
  getScaledDamageFormula(target, damageFormula) {
    const scalingFactor = this.getScalingFactorBetween(target);
    return scalingFactor ? `(${damageFormula}) ${scalingFactor}` : damageFormula;
  }

  /**
   * @private
   *
   * @param {PBActor} actor
   * @param {PBActor} targetActor
   * @returns {String}
   */
  getScalingFactorBetween(targetActor) {
    if (targetActor) {
      if (this.isAnyVehicle && (targetActor.isCharacter || targetActor.isCreature)) {
        return "* 5";
      }
      if (targetActor.isAnyVehicle && (this.isCharacter || this.isCreature)) {
        return "/ 5";
      }
    }
  }

  async useActionMacro(itemId) {
    const item = this.items.get(itemId);
    if (!item || !item.actionMacro) {
      return;
    }
    const [compendium, macroName = null] = item.actionMacro.split(";");
    if (compendium && macroName) {
      const macro = await findCompendiumItem(compendium, macroName);
      await executeMacro(macro, { actor: this, item });
    } else {
      const macro = game.macros.find((m) => m.name === macroName);
      await executeMacro(macro, { actor: this, item });
    }
  }
}
