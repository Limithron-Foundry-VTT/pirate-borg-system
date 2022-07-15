import { trackCarryingCapacity } from "../system/settings.js";
import { setSystemFlag } from "../api/utils.js";
import { findCompendiumItem } from "../api/compendium.js";

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

  /**
   * @private
   */
  _prepareItemsDerivedData() {
    this.items.forEach((item) => item.prepareActorItemDerivedData(this));
  }

  /**
   * @private
   */
  _prepareCharacterDerivedData() {
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

  /**
   * @private
   */
  _prepareContainerDerivedData() {
    this.dynamic.containerSpace = this.containerSpace;
  }

  /**
   * @private
   */
  _prepareVehicleDerivedData() {
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
      await this.deleteEmbeddedDocuments(
        "Item",
        this.items
          .filter((item) => item.type === CONFIG.PB.itemTypes.class)
          .filter((item) => (!documents[0].isBaseClass ? true : item.isBaseClass === documents[0].isBaseClass))
          .filter((item) => item.id !== documents[0].id)
          .map((item) => item.id)
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
  /**
   * @return {Object}
   */
  getData() {
    return this.system ?? this.data.data;
  }

  /**
   * @param {String} key
   * @param {any} value
   * @return {Promise<void>}
   */
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
  /**
   * @return {Object}
   */
  get attributes() {
    return this.getData().attributes;
  }

  /**
   * @param {Object} value
   * @return {Promise<void>}
   */
  async updateAttributes(value) {
    await this.updateData("attributes", value);
  }

  /**
   * @return {Object}
   */
  get abilities() {
    return this.getData().abilities;
  }

  /**
   * @param {Object} value
   * @return {Promise<void>}
   */
  async updateAbilities(value) {
    await this.updateData("abilities", value);
  }

  /**
   * @return {Object}
   */
  get dynamic() {
    return this.getData().dynamic;
  }

  /**
   * @return {Object}
   */
  get hp() {
    return this.attributes.hp;
  }

  /**
   * @param {Object} value
   * @return {Promise<void>}
   */
  async updateHp(value) {
    await this.updateAttributes({ hp: value });
  }

  // characters
  /**
   * @return {Number}
   */
  get silver() {
    return this.getData().silver;
  }

  /**
   * @param {Number} value
   * @return {Promise<void>}
   */
  async updateSilver(value) {
    await this.updateData("silver", value);
  }

  /**
   * @return {Object}
   */
  get luck() {
    return this.attributes.luck;
  }

  /**
   * @param {Object} value
   * @return {Promise<void>}
   */
  async updateLuck(value) {
    await this.updateAttributes({ luck: value });
  }

  /**
   * @return {Object}
   */
  get rituals() {
    return this.attributes.rituals;
  }

  /**
   * @param {Object} value
   * @return {Promise<void>}
   */
  async updateRituals(value) {
    await this.updateAttributes({ rituals: value });
  }

  /**
   * @return {Object}
   */
  get extraResource() {
    return this.attributes.extraResource;
  }

  /**
   * @param {Object} value
   * @return {Promise<void>}
   */
  async updateExtraResource(value) {
    await this.updateAttributes({ extraResource: value });
  }

  // Creature
  /**
   * @return {String}
   */
  get morale() {
    return this.attributes.morale;
  }

  // extra character properties
  /**
   * @return {String}
   */
  get luckDie() {
    return this.dynamic.luckDie;
  }

  /**
   * @return {Boolean}
   */
  get useExtraResource() {
    return this.dynamic.useExtraResource;
  }

  /**
   * @return {String}
   */
  get extraResourceNameSingular() {
    return this.dynamic.extraResourceNameSingular;
  }

  /**
   * @return {String}
   */
  get extraResourceNamePlural() {
    return this.dynamic.extraResourceNamePlural;
  }

  /**
   * @return {String}
   */
  get extraResourceFormula() {
    return this.dynamic.extraResourceFormula;
  }

  /**
   * @return {String}
   */
  get extraResourceFormulaLabel() {
    return this.dynamic.extraResourceFormulaLabel;
  }

  /**
   * @return {String}
   */
  get extraResourceTestFormula() {
    return this.dynamic.extraResourceTestFormula;
  }

  /**
   * @return {String}
   */
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

  /**
   * @return {Number}
   */
  get normalCarryingCapacity() {
    return this.abilities.strength.value + 8;
  }

  /**
   * @return {Number}
   */
  get maxCarryingCapacity() {
    return 2 * this.normalCarryingCapacity;
  }

  /**
   * @return {Number}
   */
  get carryingWeight() {
    return this.data.items
      .filter((item) => item.isEquipment && item.carried && !item.hasContainer)
      .filter((item) => !(item.isHat && item.equipped))
      .filter((item) => !(item.isArmor && item.equipped))
      .reduce((weight, item) => weight + item.totalCarryWeight, 0);
  }

  /**
   * @return {Boolean}
   */
  get isEncumbered() {
    if (!trackCarryingCapacity()) {
      return false;
    }
    return this.carryingWeight > this.normalCarryingCapacity;
  }

  /**
   * @return {Number}
   */
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
  /**
   * @return {PBItem[]}
   */
  get cargoItems() {
    return this.items.filter((item) => item.type === CONFIG.PB.itemTypes.cargo);
  }

  /**
   * @return {Object}
   */
  get weapons() {
    return this.getData().weapons;
  }

  /**
   * @return {String}
   */
  get broadsidesDie() {
    return this.weapons?.broadsides.die;
  }

  /**
   * @return {String}
   */
  get smallArmsDie() {
    return this.weapons?.smallArms.die;
  }

  /**
   * @return {String}
   */
  get ramDie() {
    return this.weapons?.ram.die;
  }

  /**
   * @return {String}
   */
  get captain() {
    return this.getData().captain;
  }

  /**
   * @param {String} actorId
   * @return {Promise<void>}
   */
  async setCaptain(actorId) {
    return this.updateData("captain", actorId);
  }

  /**
   * @return {Object}
   */
  get shanties() {
    return this.attributes.shanties;
  }

  /**
   * @param {Object} value
   * @return {Promise<void>}
   */
  async updateShanties(value) {
    await this.updateAttributes({ shanties: value });
  }

  /**
   * @return {String[]}
   */
  get crews() {
    return this.getData().crews || [];
  }

  /**
   * @param {String[]} crews
   * @return {Promise<void>}
   */
  async updateCrews(crews) {
    return this.updateData("crews", crews);
  }

  // crew management
  /**
   * @param {String} actorId
   * @return {Promise<void>}
   */
  async addCrew(actorId) {
    if (!this.crews.includes(actorId)) {
      return this.updateCrews([...this.crews, actorId]);
    }
  }

  /**
   * @param {String} actorId
   * @return {Promise<void>}
   */
  async removeCrew(actorId) {
    const crews = this.crews.filter((crew) => crew !== actorId);
    if (this.captain === actorId) {
      await this.setCaptain(null);
    }
    return this.updateCrews(crews);
  }

  /**
   * @return {Promise<void>}
   */
  async clearCrews() {
    await this.setCaptain(null);
    return this.updateCrews([]);
  }

  /**
   * @param {PBItem} item
   * @returns {Promise<void>}
   */
  async equipItem(item) {
    if ([CONFIG.PB.itemTypes.armor, CONFIG.PB.itemTypes.hat].includes(item.type)) {
      await setSystemFlag(this, CONFIG.PB.flags.DEFEND_ARMOR, null);
      const items = this.items.filter((otherItem) => otherItem.type === item.type).filter((otherItem) => otherItem.id !== item.id);
      for (const otherItem of items) {
        await otherItem.unequip();
      }
    }
    return item.equip();
  }

  /**
   * @param {PBItem} item
   * @returns {Promise<void>}
   */
  async unequipItem(item) {
    return item.unequip();
  }

  /**
   * @param {String} baseClass
   * @return {Promise<void>}
   */
  async setBaseClass(baseClass) {
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
   * @returns {String|Number}
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
   * @param {PBActor} target
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
}
