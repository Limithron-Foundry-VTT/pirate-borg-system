/**
 * @extends {Item}
 */
export class PBItem extends Item {
  /** @override */
  static async create(data, options = {}) {
    mergeObject(data, CONFIG.PB.itemDefaultImage[data.type] || {}, {
      overwrite: false,
    });
    return super.create(data, options);
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.system) {
      this.img = this.img || CONST.DEFAULT_TOKEN;
    } else {
      this.data.img = this.data.img || CONST.DEFAULT_TOKEN;
    }

    if (this.type === CONFIG.PB.itemTypes.armor) {
      this.getData().damageReductionDie = CONFIG.PB.armorTiers[this.tier.value].damageReductionDie;
    }
  }

  /**
   * @param {PBActor} actor
   */
  prepareActorItemDerivedData(actor) {
    if (actor.type === "character") {
      this.getData().equippable = CONFIG.PB.equippableItemTypes.includes(this.type);
      this.getData().droppable = CONFIG.PB.droppableItemTypes.includes(this.type) && this.getData().carryWeight !== 0;
    } else {
      this.getData().equippable = false;
      this.getData().droppable = false;
    }

    this.getData().canPlusMinus = CONFIG.PB.plusMinusItemTypes.includes(this.type);

    if (this.isContainer) {
      this.getData().items = this.items || [];
      this.getData().totalContainerSpace = this._getTotalContainerSpace(actor);
    }

    if (this.isEquipment) {
      this.container = this._getItemContainer(actor) || null;
      this.getData().hasContainer = !!this.container;
      this.getData().totalCarryWeight = this._getTotalCarryWeight(actor);
    }
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
    if (this.system) {
      await this.update({ [`system.${key}`]: value });
    } else {
      await this.update({ [`data.${key}`]: value });
    }
  }

  /**
   * common template properties
   */

  /**
   * @returns {String}
   */
  get description() {
    return this.getData().description;
  }

  /**
   * @param {String} description
   * @return {Promise<void>}
   */
  async setDescription(description) {
    await this.updateData("description", description);
  }

  /**
   * @returns {Number}
   */
  get containerSpace() {
    return this.getData().containerSpace;
  }

  /**
   * @returns {Number}
   */
  get carryWeight() {
    return this.getData().carryWeight;
  }

  /**
   * @returns {Boolean}
   */
  get equipped() {
    return this.getData().equipped;
  }

  /**
   *
   * @param {Boolean} equipped
   * @return {Promise<void>}
   */
  async setEquipped(equipped) {
    await this.updateData("equipped", equipped);
  }

  /**
   * @returns {Boolean}
   */
  get carried() {
    // container with carryWeight are asumed to not be carried (donkey, etc)
    if (this.carryWeight === 0) {
      return false;
    }
    return this.getData().carried;
  }

  /**
   * @param {Boolean} carried
   * @return {Promise<void>}
   */
  async setCarried(carried) {
    await this.updateData("carried", carried);
  }

  /**
   * @returns {Number}
   */
  get price() {
    return this.getData().price;
  }

  /**
   * @returns {Number}
   */
  get quantity() {
    return this.getData().quantity;
  }

  /**
   *
   * @param {Number} quantity
   * @return {Promise<void>}
   */
  async setQuantity(quantity) {
    await this.updateData("quantity", quantity);
  }

  /**
   * @returns {String}
   */
  get actionMacro() {
    return this.getData().actionMacro;
  }

  /**
   * @returns {String}
   */
  get actionMacroLabel() {
    return this.getData().actionMacroLabel;
  }

  /**
   * weapon properties
   */

  /**
   * @returns {String}
   */
  get damageDie() {
    return this.getData().damageDie;
  }

  /**
   * @returns {Number}
   */
  get critOn() {
    return this.getData().critOn;
  }

  /**
   * @returns {String}
   */
  get critExtraDamage() {
    return this.getData().critExtraDamage;
  }

  /**
   * @returns {Number}
   */
  get handed() {
    return this.getData().handed;
  }

  /**
   * @returns {Number}
   */
  get fumbleOn() {
    return this.getData().fumbleOn;
  }

  /**
   * @returns {Boolean}
   */
  get usesAmmo() {
    return this.getData().usesAmmo;
  }

  /**
   * @returns {Boolean}
   */
  get useAmmoDamage() {
    return this.getData().useAmmoDamage;
  }

  /**
   * @returns {String}
   */
  get weaponType() {
    return this.getData().weaponType;
  }

  /**
   * @returns {Boolean}
   */
  get isGunpowderWeapon() {
    return this.getData().isGunpowderWeapon;
  }

  /**
   * @returns {Boolean}
   */
  get needsReloading() {
    return this.getData().needsReloading;
  }

  /**
   * @returns {Number}
   */
  get reloadTime() {
    return this.getData().reloadTime;
  }

  /**
   * @returns {Number}
   */
  get loadingCount() {
    return this.getData().loadingCount;
  }

  /**
   *
   * @param {Number} loadingCount
   * @return {Promise<void>}
   */
  async setLoadingCount(loadingCount) {
    await this.updateData("loadingCount", loadingCount);
  }

  /**
   * container properties
   */

  /**
   * @returns {capacity}
   */
  get capacity() {
    return this.getData().capacity;
  }

  /**
   * armor properties
   */

  /**
   * @returns {{min: Number, max: Number, value: Number}}}
   */
  get tier() {
    return this.getData().tier;
  }

  /**
   * @param {{min?: Number, max?: Number, value?: Number}} tier
   * @return {Promise<void>}
   */
  async setTier(tier) {
    await this.updateData("tier", tier);
  }

  /**
   * hat properties
   */

  /**
   * @returns {Boolean}
   */
  get reduceDamage() {
    return this.getData().reduceDamage;
  }

  /**
   * @returns {String}
   */
  get ruleText() {
    return this.getData().ruleText;
  }

  /**
   * invokable properties
   */

  /**
   * @returns {String}
   */
  get invokableType() {
    return this.getData().invokableType;
  }

  /**
   * @returns {Boolean}
   */
  get isArcaneRitual() {
    return this.getData().invokableType === "Arcane Ritual";
  }

  /**
   * @returns {Boolean}
   */
  get isAncientRelic() {
    return this.getData().invokableType === "Ancient Relic";
  }

  /**
   * @returns {Boolean}
   */
  get isExtraResource() {
    return !this.isArcaneRitual && !this.isAncientRelic;
  }

  /**
   * background properties
   */

  /**
   * @returns {String}
   */
  get startingGold() {
    return this.getData().startingGold;
  }

  /**
   * @returns {String}
   */
  get startingBonusItems() {
    return this.getData().startingBonusItems;
  }

  /**
   * @returns {String}
   */
  get startingBonusRolls() {
    return this.getData().startingBonusRolls;
  }

  /**
   * @returns {String}
   */
  get startingArmorTableFormula() {
    return this.getData().startingArmorTableFormula;
  }

  /**
   * @returns {String}
   */
  get startingHatTableFormula() {
    return this.getData().startingHatTableFormula;
  }

  /**
   * @returns {String}
   */
  get startingWeaponTableFormula() {
    return this.getData().startingWeaponTableFormula;
  }

  /**
   * @returns {String}
   */
  get startingRolls() {
    return this.getData().startingRolls;
  }

  /**
   * @returns {String}
   */
  get startingAbilityScoreFormula() {
    return this.getData().startingAbilityScoreFormula;
  }

  /**
   * @returns {String}
   */
  get startingStrengthBonus() {
    return this.getData().startingStrengthBonus;
  }

  /**
   * @returns {String}
   */
  get startingAgilityBonus() {
    return this.getData().startingAgilityBonus;
  }

  /**
   * @returns {String}
   */
  get startingPresenceBonus() {
    return this.getData().startingPresenceBonus;
  }

  /**
   * @returns {String}
   */
  get startingToughnessBonus() {
    return this.getData().startingToughnessBonus;
  }

  /**
   * @returns {String}
   */
  get startingSpiritBonus() {
    return this.getData().startingSpiritBonus;
  }

  /**
   * @returns {String}
   */
  get startingHitPoints() {
    return this.getData().startingHitPoints;
  }

  /**
   * @returns {String}
   */
  get startingItems() {
    return this.getData().startingItems;
  }

  /**
   * @returns {String}
   */
  get requireBaseClass() {
    return this.getData().requireBaseClass;
  }

  /**
   * @returns {String}
   */
  get characterGeneratorMacro() {
    return this.getData().characterGeneratorMacro;
  }

  /**
   * feature properties
   */

  /**
   * @returns {String}
   */
  get featureType() {
    return this.getData().featureType;
  }

  /**
   * @returns {String}
   */
  get flavorText() {
    return this.getData().flavorText;
  }

  /**
   * @returns {Number}
   */
  get maxQuantity() {
    return this.getData().maxQuantity;
  }

  /**
   * class properties
   */

  /**
   * @returns {Boolean}
   */
  get isBaseClass() {
    return this.getData().isBaseClass === true;
  }

  /**
   * @param {Boolean} isBaseClass
   */
  set isBaseClass(isBaseClass) {
    this.getData().isBaseClass = isBaseClass;
  }

  /**
   * @returns {String}
   */
  get luckDie() {
    return this.getData().luckDie;
  }

  /**
   * @returns {Boolean}
   */
  get useExtraResource() {
    return this.getData().useExtraResource;
  }

  /**
   * @returns {String}
   */
  get extraResourceNameSingular() {
    return this.getData().extraResourceNameSingular;
  }

  /**
   * @returns {String}
   */
  get extraResourceNamePlural() {
    return this.getData().extraResourceNamePlural;
  }

  /**
   * @returns {String}
   */
  get extraResourceFormula() {
    return this.getData().extraResourceFormula;
  }

  /**
   * @returns {String}
   */
  get extraResourceFormulaLabel() {
    return this.getData().extraResourceFormulaLabel;
  }

  /**
   * @returns {String}
   */
  get extraResourceTestFormula() {
    return this.getData().extraResourceTestFormula;
  }

  /**
   * @returns {String}
   */
  get extraResourceTestFormulaLabel() {
    return this.getData().extraResourceTestFormulaLabel;
  }

  /**
   * Item types properties
   */

  /**
   * @returns {Boolean}
   */
  get isEquipment() {
    return this.getData().isEquipment ?? CONFIG.PB.itemEquipmentTypes.includes(this.type);
  }

  /**
   * @returns {Boolean}
   */
  get isContainer() {
    return this.type === CONFIG.PB.itemTypes.container;
  }

  /**
   * @returns {Boolean}
   */
  get isHat() {
    return this.type === CONFIG.PB.itemTypes.hat;
  }

  /**
   * @returns {Boolean}
   */
  get isArmor() {
    return this.type === CONFIG.PB.itemTypes.armor;
  }

  /**
   * @returns {Boolean}
   */
  get isWeapon() {
    return this.type === CONFIG.PB.itemTypes.weapon;
  }

  /**
   * @returns {Boolean}
   */
  get isAmmo() {
    return this.type === CONFIG.PB.itemTypes.ammo;
  }

  /**
   * @returns {Boolean}
   */
  get isBackground() {
    return this.type === CONFIG.PB.itemTypes.background;
  }

  /**
   * @returns {Boolean}
   */
  get isClass() {
    return this.type === CONFIG.PB.itemTypes.class;
  }

  /**
   * @returns {Boolean}
   */
  get isCargo() {
    return this.type === CONFIG.PB.itemTypes.cargo;
  }

  /**
   * @returns {Boolean}
   */
  get isFeature() {
    return this.type === CONFIG.PB.itemTypes.feature;
  }

  /**
   * @returns {Boolean}
   */
  get isInvokable() {
    return this.type === CONFIG.PB.itemTypes.invokable;
  }

  /**
   * @returns {Boolean}
   */
  get isMisc() {
    return this.type === CONFIG.PB.itemTypes.misc;
  }

  /**
   * @returns {Boolean}
   */
  get isShanty() {
    return this.type === CONFIG.PB.itemTypes.shanty;
  }

  /**
   * Weapons extra properties
   */

  /**
   * @returns {Boolean}
   */
  get isRanged() {
    return this.weaponType === "ranged";
  }

  /**
   * @returns {Boolean}
   */
  get isMelee() {
    return this.weaponType === "melee";
  }

  /**
   * @returns {Boolean}
   */
  get isThrown() {
    return this.weaponType === "thrown";
  }

  /**
   * @returns {String}
   */
  get attackAbility() {
    switch (true) {
      case this.isRanged:
        return CONFIG.PB.ability.presence;
      case this.isThrown:
        return CONFIG.PB.ability.agility;
      default:
        return CONFIG.PB.ability.strength;
    }
  }

  /**
   * @returns {Boolean}
   */
  get hasAmmo() {
    return !!this.ammoId;
  }

  /**
   * @returns {String}
   */
  get ammoId() {
    return this.getData().ammoId;
  }

  /**
   * @param {String} ammoId
   * @return {Promise<void>}
   */
  async setAmmoId(ammoId) {
    await this.updateData("ammoId", ammoId);
  }

  /**
   * Armor extra properties
   */

  /**
   * @return {String}
   */
  get damageReductionDie() {
    return this.getData().damageReductionDie;
  }

  /**
   * Item Containers
   */

  /**
   * @returns {Boolean}
   */
  get isContainerizable() {
    return CONFIG.PB.allowedContainerItemTypes.includes(this.type);
  }

  get hasContainer() {
    return this.getData().hasContainer;
  }

  get totalCarryWeight() {
    return this.getData().totalCarryWeight || 0;
  }

  get totalContainerSpace() {
    return this.getData().totalContainerSpace || 0;
  }

  get totalSpace() {
    return this.totalContainerSpace + Math.ceil(this.containerSpace * this.getData().quantity);
  }

  get items() {
    return this.getData().items || [];
  }

  /**
   *
   * @param {Array.<String>} items
   * @return {Promise<void>}
   */
  async setItems(items) {
    await this.updateData("items", items);
  }

  /**
   * @return {boolean}
   */
  get hasItems() {
    return this.items.length > 0;
  }

  /**
   * @return {Promise<void>}
   */
  async equip() {
    await this.setEquipped(true);
  }

  /**
   * @return {Promise<void>}
   */
  async unequip() {
    await this.setEquipped(false);
  }

  /**
   * @return {Promise<void>}
   */
  async carry() {
    await this.setCarried(true);
  }

  /**
   * @return {Promise<void>}
   */
  async drop() {
    await this.setCarried(false);
  }

  /**
   * @param {String} itemId
   * @return {Promise<void>}
   */
  async addItem(itemId) {
    if (!this.items.includes(itemId)) {
      await this.setItems([...this.items, itemId]);
    }
  }

  /**
   * @param {String} itemId
   * @return {Promise<void>}
   */
  async removeItem(itemId) {
    const items = this.items.filter((item) => item !== itemId);
    await this.setItems(items);
  }

  /**
   * @return {Promise<void>}
   */
  async clearItems() {
    await this.setItems([]);
  }

  /**
   * @private
   * @param {PBActor} actor
   * @return {Number}
   */
  _getTotalCarryWeight(actor) {
    if (this.isContainer) {
      return (
        this.items.reduce((weight, itemId) => {
          /** @type {PBItem} */
          const item = actor.items.get(itemId);
          if (item) {
            weight += Math.ceil(item.carryWeight * item.quantity);
          }
          return weight;
        }, 0) + this.carryWeight
      );
    }
    return Math.ceil(this.carryWeight * this.quantity);
  }

  /**
   * @private
   * @param {PBActor} actor
   * @return {Number}
   */
  _getTotalContainerSpace(actor) {
    return this.items.reduce((space, itemId) => {
      /** @type {PBItem} */
      const item = actor.items.get(itemId);
      if (item) {
        space += Math.ceil(item.containerSpace * item.quantity);
      }
      return space;
    }, 0);
  }

  /**
   * @private
   * @param {PBActor} actor
   * @return {PBItem[]}
   */
  _getItemContainer(actor) {
    return actor.items.filter((item) => item.isContainer).find((item) => item.items.includes(this.id));
  }
}
