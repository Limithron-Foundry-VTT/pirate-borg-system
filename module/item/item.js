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
    this.data.img = this.data.img || CONST.DEFAULT_TOKEN;

    if (this.type === CONFIG.PB.itemTypes.armor) {
      this.getData().damageReductionDie = CONFIG.PB.armorTiers[this.tier.value].damageReductionDie;
    }
  }

  /** @override */
  prepareActorItemDerivedData(actor) {
    if (actor.type === "character") {
      this.getData().equippable = CONFIG.PB.equippableItemTypes.includes(this.type);
      this.getData().droppable = CONFIG.PB.droppableItemTypes.includes(this.type) && this.getData().carryWeight !== 0;
      this.getData().canPlusMinus = CONFIG.PB.plusMinusItemTypes.includes(this.type);
    } else {
      this.getData().equippable = false;
      this.getData().droppable = false;
    }

    if (this.isContainer) {
      this.getData().itemsData = this._getItemsData(actor);
      this.getData().totalContainerSpace = this._getTotalContainerSpace(actor);
    }

    if (this.isEquipment) {
      this.container = this._getItemContainer(actor) || null;
      this.getData().hasContainer = !!this.container;
      this.getData().totalCarryWeight = this._getTotalCarryWeight(actor);
    }
  }

  /** V10 */
  getData() {
    return this.system ?? this.data.data;
  }

  async updateData(key, value) {
    await this.update({ [`data.${key}`]: value });
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
   * @param {Boolean} equipped
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
   * @param {Number} quantity
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
   * @returns {Number}
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
   * @param {{min: Number, max: Number, value: Number}}
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
   * @returns {String}
   */
  get isArcaneRitual() {
    return this.getData().invokableType === "Arcane Ritual";
  }

  /**
   * @returns {String}
   */
  get isAncientRelic() {
    return this.getData().invokableType === "Ancient Relic";
  }

  /**
   * @returns {String}
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
   * @returns {Number}  
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
   * @returns {String}
   */
  get attackAbility() {
    return this.isRanged ? CONFIG.PB.abilityKey.presence : CONFIG.PB.abilityKey.strength;
  }

  /**
   * @returns {Boolean}
   */
  get hasAmmo() {
    return !!this.ammoId;
  }

  /**
   * @returns {Number}
   */
  get ammoId() {
    return this.getData().ammoId;
  }

  /**
   * @param {{min: Number, max: Number, value: Number}}
   */
  async setAmmoId(ammoId) {
    await this.updateData("ammoId", ammoId);
  }

  /**
   * Armor extra properties
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

  get itemsData() {
    return this.getData().itemsData || [];
  }

  get items() {
    return this.getData().items || [];
  }

  /**
   * @param {Array.<String>} items
   */
  async setItems(items) {
    await this.updateData("items", items);
  }

  get hasItems() {
    return this.items.length > 0;
  }

  async equip() {
    await this.setEquipped(true);
  }

  async unequip() {
    await this.setEquipped(false);
  }

  async carry() {
    await this.setCarried(true);
  }

  async drop() {
    await this.setCarried(false);
  }

  async addItem(itemId) {
    if (!this.items.includes(itemId)) {
      this.setItems([...this.items, itemId]);
    }
  }

  async removeItem(itemId) {
    const items = this.items.filter((item) => item !== itemId);
    this.setItems(items);
  }

  async clearItems() {
    this.setItems([]);
  }

  _getTotalCarryWeight(actor) {
    if (this.isContainer) {
      return (
        this.items.reduce((weight, itemId) => {
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

  _getTotalContainerSpace(actor) {
    return this.items.reduce((space, itemId) => {
      const item = actor.items.get(itemId);
      if (item) {
        space += Math.ceil(item.containerSpace * item.quantity);
      }
      return space;
    }, 0);
  }

  _getItemsData(actor) {
    return this.items.reduce((initial, itemId) => {
      const item = actor.items.get(itemId);
      if (item) {
        initial.push(item.data);
      }
      return initial;
    }, []);
  }

  _getItemContainer(actor) {
    return actor.items.filter((item) => item.isContainer).find((item) => item.items.includes(this.id));
  }
}
