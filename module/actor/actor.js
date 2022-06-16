import { trackCarryingCapacity } from "../system/settings.js";
import { setSystemFlag } from "../utils.js";
import { findCompendiumItem } from "../compendium.js";
import { executeMacro } from "../macro-helpers.js";

/**
 * @extends {Actor}
 */
export class PBActor extends Actor {
  /** @override */
  static async create(data, options = {}) {
    mergeObject(data, CONFIG.PB.actorDefaults[data.type] || {}, {
      overwrite: false,
    });
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
  async prepareDerivedData() {
    super.prepareDerivedData();
    this._prepareItemsDerivedData();
    this.getData().dynamic = this.getData().dynamic ?? {};

    switch (this.type) {
      case CONFIG.PB.actorTypes.character:
        await this._prepareCharacterDerivedData();
        break;
      case CONFIG.PB.actorTypes.container:
        await this._prepareContainerDerivedData();
        break;
      case CONFIG.PB.actorTypes.vehicle:
      case CONFIG.PB.actorTypes.vehicle_npc:
        await this._prepareVehicleDerivedData();
        break;
    }
  }

  _prepareItemsDerivedData() {
    this.items.forEach((item) => item.prepareActorItemDerivedData(this));
  }

  async _prepareCharacterDerivedData() {
    this.getData().dynamic.carryingWeight = this.carryingWeight();
    this.getData().dynamic.carryingCapacity = this.normalCarryingCapacity();
    this.getData().dynamic.encumbered = this.isEncumbered();
    this.getData().dynamic.baseClass = (await this.getCharacterBaseClassItem())?.toObject(true);
  }

  async _prepareContainerDerivedData() {
    this.getData().dynamic.containerSpace = this.containerSpace();
  }

  async _prepareVehicleDerivedData() {
    this.getData().attributes.cargo.value = this.cargoItems.length;
    if (this.getData().weapons.broadsides.quantity > 1) {
      this.getData().dynamic.hasBroadsidesPenalties =
        this.getData().attributes.hp.value < this.getData().attributes.hp.max - this.getData().attributes.hp.max / this.getData().weapons.broadsides.quantity;
    } else {
      this.getData().dynamic.hasBroadsidesPenalties = false;
    }
    if (this.getData().weapons.smallArms.quantity > 1) {
      this.getData().dynamic.hasSmallArmsPenalties =
        this.getData().attributes.hp.value < this.getData().attributes.hp.max - this.getData().attributes.hp.max / this.getData().weapons.smallArms.quantity;
    } else {
      this.getData().dynamic.hasSmallArmsPenalties = false;
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
          .map((item) => item.id),
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

  /** V10 */
  getData() {
    return this.system ?? this.data.data;
  }

  async updateData(key, value) {
    await this.update({ [`data.${key}`]: value });
  }

  get attributes() {
    return this.getData().attributes;
  }

  async updateAttributes(value) {
    await this.updateData("attributes", value);
  }

  get abilities() {
    return this.getData().abilities;
  }

  get silver() {
    return this.getData().silver;
  }

  async updateSilver(value) {
    await this.updateData("silver", value);
  }

  get hp() {
    return this.attributes.hp;
  }

  async updateHp(value) {
    await this.updateAttributes({ hp: value });
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

  /**
   * @returns {Boolean}
   */
  isCharacter() {
    return this.type === CONFIG.PB.actorTypes.character;
  }

  /**
   * @returns {Boolean}
   */
  isCreature() {
    return this.type === CONFIG.PB.actorTypes.creature;
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

  normalCarryingCapacity() {
    return this.abilities.strength.value + 8;
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

  /**
   * @returns {Boolean}
   */
  isInCombat() {
    return (game.combats.active?.combatants ?? []).some((combatant) => combatant.actor.id === this.id);
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

  getUseExtraResource() {
    const characterClass = this.getCharacterClass();
    return characterClass.getData().useExtraResource || this.getData().dynamic.baseClass?.useExtraResource;
  }

  getExtraResourceFormula() {
    const characterClass = this.getCharacterClass();
    return characterClass.getData().extraResourceFormula ?? this.getData().dynamic.baseClass?.extraResourceFormula;
  }

  getExtraResourceFormulaLabel() {
    const characterClass = this.getCharacterClass();
    return characterClass.getData().extraResourceFormulaLabel ?? this.getData().dynamic.baseClass?.extraResourceFormulaLabel;
  }

  getExtraResourceTestFormula() {
    const characterClass = this.getCharacterClass();
    return characterClass.getData().extraResourceTestFormula ?? this.getData().dynamic.baseClass?.extraResourceTestFormula;
  }

  getExtraResourceTestFormulaLabel() {
    const characterClass = this.getCharacterClass();
    return characterClass.getData().extraResourceTestFormulaLabel ?? this.getData().dynamic.baseClass?.extraResourceTestFormulaLabel;
  }

  getExtraResourceFormulaPlural() {
    const characterClass = this.getCharacterClass();
    return characterClass.getData().extraResourceNamePlural ?? this.getData().dynamic.baseClass?.extraResourceNamePlural;
  }

  getCharacterClass() {
    return this.items.find((item) => item.type === CONFIG.PB.itemTypes.class);
  }

  async setBaseCharacterClass(baseClass) {
    await this.update({ "data.baseClass": baseClass });
  }

  async getCharacterBaseClassItem() {
    const [compendium, item] = this.getData().baseClass.split(";");
    if (compendium && item) {
      return await findCompendiumItem(compendium, item);
    }
  }

  getLuckDie() {
    return this.getData().dynamic.baseClass?.data.luckDie ?? this.getCharacterClass().getData().luckDie ?? "";
  }

  // Ships
  get cargoItems() {
    return this.items.filter((item) => item.type === CONFIG.PB.itemTypes.cargo);
  }

  get broadsidesDie() {
    return this.getData().weapons?.broadsides.die;
  }

  get smallArmsDie() {
    return this.getData().weapons?.smallArms.die;
  }

  get ramDie() {
    return this.getData().weapons?.ram.die;
  }

  get captain() {
    return this.getData().captain;
  }

  async setCaptain(actorId) {
    return await this.update({ "data.captain": actorId });
  }

  get shanties() {
    return this.getData().attributes.shanties;
  }

  async updateShanties(value) {
    await this.updateAttributes({ shanties: value });
  }

  get crews() {
    return this.getData().crews || [];
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

  /**
   * @returns {String}
   */
  getActorArmorFormula() {
    switch (this.type) {
      case CONFIG.PB.actorTypes.character:
        return this.equippedArmor()?.damageReductionDie ?? 0;
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
        return this.firstEquippedWeapon()?.damageDie ?? "1d2";
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
      if (this.isAnyVehicle() && (targetActor.isCharacter() || targetActor.isCreature())) {
        return "* 5";
      }
      if (targetActor.isAnyVehicle() && (this.isCharacter() || this.isCreature())) {
        return "/ 5";
      }
    }
  }
}
