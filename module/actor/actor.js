import { addShowDicePromise, diceSound, showDice } from "../dice.js";
import ScvmDialog from "../scvm/scvm-dialog.js";
import { rollAncientRelics, rollArcaneRituals, handleClassGettingBetterRollTable } from "../scvm/scvmfactory.js";
import { trackAmmo, trackCarryingCapacity } from "../settings.js";
import { findCompendiumItem, invokeGettingBetterMacro } from "../scvm/scvmfactory.js";
import { executeMacro } from "../macro-helpers.js";

const ATTACK_DIALOG_TEMPLATE =
  "systems/pirateborg/templates/dialog/attack-dialog.html";
const ATTACK_ROLL_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/attack-roll-card.html";
const BROKEN_ROLL_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/broken-roll-card.html";
const DEFEND_DIALOG_TEMPLATE =
  "systems/pirateborg/templates/dialog/defend-dialog.html";
const DEFEND_ROLL_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/defend-roll-card.html";
const GET_BETTER_ROLL_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/get-better-roll-card.html";
const MORALE_ROLL_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/morale-roll-card.html";
const OUTCOME_ONLY_ROLL_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/outcome-only-roll-card.html";
const OUTCOME_ROLL_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/outcome-roll-card.html";
const REACTION_ROLL_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/reaction-roll-card.html";
const TEST_ABILITY_ROLL_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/test-ability-roll-card.html";

const WIELD_INVOKABLE_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/wield-invokable-card.html";

const MYSTICAL_MISHAP_CARD_TEMPLATE =
  "systems/pirateborg/templates/chat/mystical-mishap-card.html";


/**
 * @extends {Actor}
 */
export class PBActor extends Actor {
  /** @override */
  static async create(data, options = {}) {
    data.token = data.token || {};
    let defaults = {};
    if (data.type === "character") {
      defaults = {
        actorLink: true,
        disposition: 1,
        vision: true,
      };
    } else if (data.type === "container") {
      defaults = {
        actorLink: false,
        disposition: 0,
        vision: false,
      };
    } else if (data.type === "creature") {
      defaults = {
        actorLink: false,
        disposition: -1,
        vision: false,
      };
    }
    mergeObject(data.token, defaults, { overwrite: false });
    return super.create(data, options);
  }

  /** @override */
  _onCreate(data, options, userId) {
    if (data.type === "character") {
      // give Characters a default class
      this._addDefaultClass();
    }
    super._onCreate(data, options, userId);
  }

  async _addDefaultClass() {
    if (game.packs) {
      const hasAClass =
        this.items.filter((i) => i.data.type === "class").length > 0;
      if (!hasAClass) {
        const pack = game.packs.get("pirateborg.class-classless-adventurer");
        if (!pack) {
          console.error(
            "Could not find compendium pirateborg.class-classless-adventurer"
          );
          return;
        }
        const index = await pack.getIndex();
        const entry = index.find((e) => e.name === "Adventurer");
        if (!entry) {
          console.error("Could not find Adventurer class in compendium.");
          return;
        }
        const entity = await pack.getDocument(entry._id);
        if (!entity) {
          console.error("Could not get document for Adventurer class.");
          return;
        }
        await this.createEmbeddedDocuments("Item", [duplicate(entity.data)]);
      }
    }
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();

    this.items.forEach((item) => item.prepareActorItemDerivedData(this));

    if (this.type === "character") {
      this.data.data.carryingWeight = this.carryingWeight();
      this.data.data.carryingCapacity = this.normalCarryingCapacity();
      this.data.data.encumbered = this.isEncumbered();
    }

    if (this.type === "container") {
      this.data.data.containerSpace = this.containerSpace();
    }
  }

  /** @override */
  _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    if (documents[0].data.type === CONFIG.PB.itemTypes.class) {
      this._deleteEarlierItems(CONFIG.PB.itemTypes.class);
    }
    super._onCreateEmbeddedDocuments(
      embeddedName,
      documents,
      result,
      options,
      userId
    );
  }

  _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    for (const document of documents) {
      if (document.isContainer) {
        this.deleteEmbeddedDocuments("Item", document.items);
      }
      if (document.hasContainer) {
        document.container.removeItem(document.id);
      }
    }

    super._onDeleteEmbeddedDocuments(
      embeddedName,
      documents,
      result,
      options,
      userId
    );
  }

  async _deleteEarlierItems(itemType) {
    const itemsOfType = this.items.filter((i) => i.data.type === itemType);
    itemsOfType.pop(); // don't delete the last one
    const deletions = itemsOfType.map((i) => i.id);
    // not awaiting this async call, just fire it off
    this.deleteEmbeddedDocuments("Item", deletions);
  }

  /** @override */
  getRollData() {
    const data = super.getRollData();
    return data;
  }

  _firstEquipped(itemType) {
    for (const item of this.data.items) {
      if (item.type === itemType && item.data.data.equipped) {
        return item;
      }
    }
    return undefined;
  }

  equippedArmor() {
    return this._firstEquipped("armor");
  }

  equippedHat() {
    return this._firstEquipped("hat");
  }

  async equipItem(item) {
    if (
      [CONFIG.PB.itemTypes.armor, CONFIG.PB.itemTypes.hat].includes(
        item.type
      )
    ) {
      for (const otherItem of this.items) {
        if (otherItem.type === item.type) {
          await otherItem.unequip();
        }
      }
    }
    await item.equip();
  }

  async unequipItem(item) {
    await item.unequip();
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
      .filter(item => !(item.isHat && item.equipped))
      .filter(item => !(item.isArmor && item.equipped))
      .reduce((weight, item) => weight + item.totalCarryWeight, 0);
  }

  isEncumbered() {
    if (!trackCarryingCapacity()) {
      return false;
    }
    return this.carryingWeight() > this.normalCarryingCapacity();
  }

  containerSpace() {
    return this.data.items
      .filter((item) => item.isEquipment && !item.hasContainer)
      .reduce((containerSpace, item) => containerSpace + item.totalSpace, 0);
  }

  async _testAbility(ability, abilityKey, abilityAbbrevKey, drModifiers) {
    const abilityRoll = new Roll(
      `1d20+@abilities.${ability}.value`,
      this.getRollData()
    );
    abilityRoll.evaluate({ async: false });
    await showDice(abilityRoll);
    const rollResult = {
      abilityKey,
      abilityRoll,
      displayFormula: `1d20 + ${game.i18n.localize(abilityAbbrevKey)}`,
      drModifiers,
    };
    const html = await renderTemplate(
      TEST_ABILITY_ROLL_CARD_TEMPLATE,
      rollResult
    );
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async testStrength() {
    const drModifiers = [];
    if (this.isEncumbered()) {
      drModifiers.push(
        `${game.i18n.localize("PB.Encumbered")}: ${game.i18n.localize(
          "PB.DR"
        )} +2`
      );
    }
    await this._testAbility(
      "strength",
      "PB.AbilityStrength",
      "PB.AbilityStrengthAbbrev",
      drModifiers
    );
  }

  async testAgility() {
    const drModifiers = [];
    const armor = this.equippedArmor();
    if (armor) {
      const armorTier = CONFIG.PB.armorTiers[armor.data.data.tier.max];
      if (armorTier.agilityModifier) {
        drModifiers.push(
          `${armor.name}: ${game.i18n.localize("PB.DR")} +${
            armorTier.agilityModifier
          }`
        );
      }
    }
    if (this.isEncumbered()) {
      drModifiers.push(
        `${game.i18n.localize("PB.Encumbered")}: ${game.i18n.localize(
          "PB.DR"
        )} +2`
      );
    }
    await this._testAbility(
      "agility",
      "PB.AbilityAgility",
      "PB.AbilityAgilityAbbrev",
      drModifiers
    );
  }

  async testPresence() {
    await this._testAbility(
      "presence",
      "PB.AbilityPresence",
      "PB.AbilityPresenceAbbrev",
      null
    );
  }

  async testToughness() {
    await this._testAbility(
      "toughness",
      "PB.AbilityToughness",
      "PB.AbilityToughnessAbbrev",
      null
    );
  }

  async testSpirit() {
    await this._testAbility(
      "spirit",
      "PB.AbilitySpirit",
      "PB.AbilitySpiritAbbrev",
      null
    );
  }

  /**
   * Attack!
   */
  async attack(itemId) {
    let attackDR = await this.getFlag(
      CONFIG.PB.flagScope,
      CONFIG.PB.flags.ATTACK_DR
    );
    if (!attackDR) {
      attackDR = 12; // default
    }
    const targetArmor = await this.getFlag(
      CONFIG.PB.flagScope,
      CONFIG.PB.flags.TARGET_ARMOR
    );
    const dialogData = {
      attackDR,
      config: CONFIG.pirateborg,
      itemId,
      targetArmor,
    };
    const html = await renderTemplate(ATTACK_DIALOG_TEMPLATE, dialogData);
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("PB.Attack"),
        content: html,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: game.i18n.localize("PB.Roll"),
            // callback: html => resolve(_createItem(this.actor, html[0].querySelector("form")))
            callback: (html) => this._attackDialogCallback(html),
          },
        },
        default: "roll",
        close: () => resolve(null),
      }).render(true);
    });
  }

  /**
   * Callback from attack dialog.
   */
  async _attackDialogCallback(html) {
    const form = html[0].querySelector("form");
    const itemId = form.itemid.value;
    const attackDR = parseInt(form.attackdr.value);
    const targetArmor = form.targetarmor.value;
    if (!itemId || !attackDR) {
      // TODO: prevent form submit via required fields
      return;
    }
    await this.setFlag(
      CONFIG.PB.flagScope,
      CONFIG.PB.flags.ATTACK_DR,
      attackDR
    );
    await this.setFlag(
      CONFIG.PB.flagScope,
      CONFIG.PB.flags.TARGET_ARMOR,
      targetArmor
    );
    this._rollAttack(itemId, attackDR, targetArmor);
  }

  /**
   * Do the actual attack rolls and resolution.
   */
  async _rollAttack(itemId, attackDR, targetArmor) {
    const item = this.items.get(itemId);
    const itemRollData = item.getRollData();
    const actorRollData = this.getRollData();

    // roll 1: attack
    const isRanged = itemRollData.weaponType === "ranged";
    // ranged weapons use presence; melee weapons use strength
    const ability = isRanged ? "presence" : "strength";
    const attackRoll = new Roll(
      `d20+@abilities.${ability}.value`,
      actorRollData
    );
    attackRoll.evaluate({ async: false });
    await showDice(attackRoll);

    const d20Result = attackRoll.terms[0].results[0].result;
    const fumbleTarget = itemRollData.fumbleOn ?? 1;
    const critTarget = itemRollData.critOn ?? 20;
    const isFumble = d20Result <= fumbleTarget;
    const isCrit = d20Result >= critTarget;
    // nat 1 is always a miss, nat 20 is always a hit, otherwise check vs DR
    const isHit =
      attackRoll.total !== 1 &&
      (attackRoll.total === 20 || attackRoll.total >= attackDR);

    let attackOutcome = null;
    let damageRoll = null;
    let targetArmorRoll = null;
    let takeDamage = null;
    if (isHit) {
      // HIT!!!
      attackOutcome = game.i18n.localize(
        isCrit ? "PB.AttackCritText" : "PB.Hit"
      );
      // roll 2: damage.
      // Use parentheses for critical 2x in case damage die something like 1d6+1
      
      const damageFormula = isCrit ? "(@damageDie) * 2" : "@damageDie";
      damageRoll = new Roll(damageFormula, itemRollData);
      damageRoll.evaluate({ async: false });
      const dicePromises = [];
      addShowDicePromise(dicePromises, damageRoll);
      let damage = damageRoll.total;
      // roll 3: target damage reduction
      if (targetArmor) {
        targetArmorRoll = new Roll(targetArmor, {});
        targetArmorRoll.evaluate({ async: false });
        addShowDicePromise(dicePromises, targetArmorRoll);
        damage = Math.max(damage - targetArmorRoll.total, 0);
      }
      if (dicePromises) {
        await Promise.all(dicePromises);
      }
      takeDamage = `${game.i18n.localize(
        "PB.Inflict"
      )} ${damage} ${game.i18n.localize("PB.Damage")}`;
    } else {
      // MISS!!!
      attackOutcome = game.i18n.localize(
        isFumble ? "PB.AttackFumbleText" : "PB.Miss"
      );
    }

    // TODO: decide keys in handlebars/template?
    const abilityAbbrevKey = isRanged
      ? "PB.AbilityPresenceAbbrev"
      : "PB.AbilityStrengthAbbrev";
    const weaponTypeKey = isRanged
      ? "PB.WeaponTypeRanged"
      : "PB.WeaponTypeMelee";
    const rollResult = {
      actor: this,
      attackDR,
      attackFormula: `1d20 + ${game.i18n.localize(abilityAbbrevKey)}`,
      attackRoll,
      attackOutcome,
      damageRoll,
      items: [item],
      takeDamage,
      targetArmorRoll,
      weaponTypeKey,
    };
    await this._decrementWeaponAmmo(item);
    await this._renderAttackRollCard(rollResult);
  }

  async _decrementWeaponAmmo(weapon) {
    if (weapon.data.data.usesAmmo && weapon.data.data.ammoId && trackAmmo()) {
      const ammo = this.items.get(weapon.data.data.ammoId);
      if (ammo) {
        const attr = "data.quantity";
        const currQuantity = getProperty(ammo.data, attr);
        if (currQuantity > 1) {
          // decrement quantity by 1
          await ammo.update({ [attr]: currQuantity - 1 });
        } else {
          // quantity is now zero, so delete ammo item
          await this.deleteEmbeddedDocuments("Item", [ammo.id]);
        }
      }
    }
  }

  /**
   * Show attack rolls/result in a chat roll card.
   */
  async _renderAttackRollCard(rollResult) {
    const html = await renderTemplate(ATTACK_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  /**
   * Defend!
   */
  async defend() {
    // look up any previous DR or incoming attack value
    let defendDR = await this.getFlag(
      CONFIG.PB.flagScope,
      CONFIG.PB.flags.DEFEND_DR
    );
    if (!defendDR) {
      defendDR = 12; // default
    }
    let incomingAttack = await this.getFlag(
      CONFIG.PB.flagScope,
      CONFIG.PB.flags.INCOMING_ATTACK
    );
    if (!incomingAttack) {
      incomingAttack = "1d4"; // default
    }

    const armor = this.equippedArmor();
    const drModifiers = [];
    if (armor) {
      // armor defense adjustment is based on its max tier, not current
      // TODO: maxTier is getting stored as a string
      const maxTier = parseInt(armor.data.data.tier.max);
      const defenseModifier = CONFIG.PB.armorTiers[maxTier].defenseModifier;
      if (defenseModifier) {
        drModifiers.push(
          `${armor.name}: ${game.i18n.localize("PB.DR")} +${defenseModifier}`
        );
      }
    }
    if (this.isEncumbered()) {
      drModifiers.push(
        `${game.i18n.localize("PB.Encumbered")}: ${game.i18n.localize(
          "PB.DR"
        )} +2`
      );
    }

    const dialogData = {
      defendDR,
      drModifiers,
      incomingAttack,
    };
    const html = await renderTemplate(DEFEND_DIALOG_TEMPLATE, dialogData);

    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("PB.Defend"),
        content: html,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: game.i18n.localize("PB.Roll"),
            callback: (html) => this._defendDialogCallback(html),
          },
        },
        default: "roll",
        render: (html) => {
          html
            .find("input[name='defensebasedr']")
            .on("change", this._onDefenseBaseDRChange.bind(this));
          html.find("input[name='defensebasedr']").trigger("change");
        },
        close: () => resolve(null),
      }).render(true);
    });
  }

  _onDefenseBaseDRChange(event) {
    event.preventDefault();
    const baseInput = $(event.currentTarget);
    let drModifier = 0;
    const armor = this.equippedArmor();
    if (armor) {
      // TODO: maxTier is getting stored as a string
      const maxTier = parseInt(armor.data.data.tier.max);
      const defenseModifier = CONFIG.PB.armorTiers[maxTier].defenseModifier;
      if (defenseModifier) {
        drModifier += defenseModifier;
      }
    }
    if (this.isEncumbered()) {
      drModifier += 2;
    }
    const modifiedDr = parseInt(baseInput[0].value) + drModifier;
    // TODO: this is a fragile way to find the other input field
    const modifiedInput = baseInput
      .parent()
      .parent()
      .find("input[name='defensemodifieddr']");
    modifiedInput.val(modifiedDr.toString());
  }

  /**
   * Callback from defend dialog.
   */
  async _defendDialogCallback(html) {
    const form = html[0].querySelector("form");
    const baseDR = parseInt(form.defensebasedr.value);
    const modifiedDR = parseInt(form.defensemodifieddr.value);
    const incomingAttack = form.incomingattack.value;
    if (!baseDR || !modifiedDR || !incomingAttack) {
      // TODO: prevent dialog/form submission w/ required field(s)
      return;
    }
    await this.setFlag(CONFIG.PB.flagScope, CONFIG.PB.flags.DEFEND_DR, baseDR);
    await this.setFlag(
      CONFIG.PB.flagScope,
      CONFIG.PB.flags.INCOMING_ATTACK,
      incomingAttack
    );
    this._rollDefend(modifiedDR, incomingAttack);
  }

  /**
   * Do the actual defend rolls and resolution.
   */
  async _rollDefend(defendDR, incomingAttack) {
    const rollData = this.getRollData();
    const armor = this.equippedArmor();
    const hat = this.equippedHat();

    // roll 1: defend
    const defendRoll = new Roll("d20+@abilities.agility.value", rollData);
    defendRoll.evaluate({ async: false });
    await showDice(defendRoll);

    const d20Result = defendRoll.terms[0].results[0].result;
    const isFumble = d20Result === 1;
    const isCrit = d20Result === 20;

    const items = [];
    let damageRoll = null;
    let armorRoll = null;
    let defendOutcome = null;
    let takeDamage = null;

    if (isCrit) {
      // critical success
      defendOutcome = game.i18n.localize("PB.DefendCritText");
    } else if (defendRoll.total >= defendDR) {
      // success
      defendOutcome = game.i18n.localize("PB.Dodge");
    } else {
      // failure
      if (isFumble) {
        defendOutcome = game.i18n.localize("PB.DefendFumbleText");
      } else {
        defendOutcome = game.i18n.localize("PB.YouAreHit");
      }

      // roll 2: incoming damage
      let damageFormula = incomingAttack;
      if (isFumble) {
        damageFormula += " * 2";
      }
      damageRoll = new Roll(damageFormula, {});
      damageRoll.evaluate({ async: false });
      const dicePromises = [];
      addShowDicePromise(dicePromises, damageRoll);
      let damage = damageRoll.total;

      // roll 3: damage reduction from equipped armor and hat
      let damageReductionDie = "";
      if (armor) {
        damageReductionDie =
          CONFIG.PB.armorTiers[armor.data.data.tier.value].damageReductionDie;
        items.push(armor);
      }

      if (hat && hat.data.data.reduceDamage) {
        damageReductionDie += "+1";
        items.push(hat);
      }
      if (damageReductionDie) {
        armorRoll = new Roll("@die", { die: damageReductionDie });
        armorRoll.evaluate({ async: false });
        addShowDicePromise(dicePromises, armorRoll);
        damage = Math.max(damage - armorRoll.total, 0);
      }
      if (dicePromises) {
        await Promise.all(dicePromises);
      }
      takeDamage = `${game.i18n.localize(
        "PB.Take"
      )} ${damage} ${game.i18n.localize("PB.Damage")}`;
    }

    const rollResult = {
      actor: this,
      armorRoll,
      damageRoll,
      defendDR,
      defendFormula: `1d20 + ${game.i18n.localize("PB.AbilityAgilityAbbrev")}`,
      defendOutcome,
      defendRoll,
      items,
      takeDamage,
    };
    await this._renderDefendRollCard(rollResult);
  }

  /**
   * Show attack rolls/result in a chat roll card.
   */
  async _renderDefendRollCard(rollResult) {
    const html = await renderTemplate(DEFEND_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  /**
   * Check morale!
   */
  async checkMorale() {
    const actorRollData = this.getRollData();
    const moraleRoll = new Roll("2d6", actorRollData);
    moraleRoll.evaluate({ async: false });
    await showDice(moraleRoll);

    let outcomeRoll = null;
    // must have a non-zero morale to possibly fail a morale check
    if (this.data.data.morale && moraleRoll.total > this.data.data.morale) {
      outcomeRoll = new Roll("1d6", actorRollData);
      outcomeRoll.evaluate({ async: false });
      await showDice(outcomeRoll);
    }
    await this._renderMoraleRollCard(moraleRoll, outcomeRoll);
  }

  /**
   * Show morale roll/result in a chat roll card.
   */
  async _renderMoraleRollCard(moraleRoll, outcomeRoll) {
    let outcomeKey = null;
    if (outcomeRoll) {
      outcomeKey =
        outcomeRoll.total <= 3 ? "PB.MoraleFlees" : "PB.MoraleSurrenders";
    } else {
      outcomeKey = "PB.StandsFirm";
    }
    const outcomeText = game.i18n.localize(outcomeKey);
    const rollResult = {
      actor: this,
      outcomeRoll,
      outcomeText,
      moraleRoll,
    };
    const html = await renderTemplate(MORALE_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  /**
   * Check reaction!
   */
  async checkReaction() {
    const table = await findCompendiumItem('pirateborg.rolls-gamemaster', 'Reaction');
    const result = await table.draw({ displayChat: false })
    await this._renderReactionRollCard(result);
  }

  /**
   * Show reaction roll/result in a chat roll card.
   */
  async _renderReactionRollCard(result) {
    const rollResult = {
      actor: this,
      reactionRoll: result.roll,
      reactionText: result.results[0].data.text,
    };
    const html = await renderTemplate(REACTION_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async invokeInvokable(itemId) {
    const item = this.items.get(itemId);
    if (!item || !item.data.data.invokableType) {
      return;
    }

    switch(item.data.data.invokableType) {
      case 'Arcane Ritual': 
        await this.invokeArcaneRitual(item);
        break;
      case 'Ancient Relic': 
        await this.invokeAncientRelic(item);
        break;
      default:
        await this.invokeExtraResource(item);
        break;
    }
  }

  async invokeExtraResource(item) {
    if (this.data.data.extraResourceUses.value < 1) {
      ui.notifications.warn(
        `${game.i18n.format("PB.NoResourceUsesRemaining", {
            type: item.data.data.invokableType
        })}!`
      );
      return;
    }
    const clazz = this.items.find((item) => item.type === CONFIG.PB.itemTypes.class)   

    const wieldRoll = new Roll(clazz.data.data.extraResourceTestFormula, this.getRollData());

    wieldRoll.evaluate({ async: false });
    await showDice(wieldRoll);

    const d20Result = wieldRoll.terms[0].results[0].result;
    const isFumble = d20Result === 1;
    const isCrit = d20Result === 20;
    const wieldDR = 12;
    const isSuccess = wieldRoll.total >= wieldDR;

    let wieldOutcome = null;

    if (isSuccess) {
      wieldOutcome = game.i18n.localize(isCrit ? "PB.InvokableCriticalSuccess" : "PB.InvokableSuccess");
    } else {
      wieldOutcome = game.i18n.localize(isFumble ? "PB.InvokableFumble" : "PB.InvokableFailure");
    }

    const rollResult = {
      item: item.data,
      actor: this.data,
      title: game.i18n.format("PB.InvokableTitle", {
        type: item.data.data.invokableType,
      }),
      wieldDR,
      wieldFormula: clazz.data.data.extraResourceTestFormulaLabel,
      wieldOutcome,
      wieldRoll
    };

    const html = await renderTemplate(WIELD_INVOKABLE_CARD_TEMPLATE, rollResult);

    await ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });

    const extraResourceUses = Math.max(0, this.data.data.extraResourceUses.value - 1);
    await this.update({ ["data.extraResourceUses.value"]: extraResourceUses });

    if (isSuccess) {
      await this.useActionMacro(item.id);
    }
  }


  async invokeAncientRelic(item)  {
    const wieldRoll = new Roll("d20+@abilities.spirit.value", this.getRollData());

    wieldRoll.evaluate({ async: false });
    await showDice(wieldRoll);

    const d20Result = wieldRoll.terms[0].results[0].result;
    const isFumble = d20Result === 1;
    const isCrit = d20Result === 20;
    const wieldDR = 12;
    const isSuccess = wieldRoll.total >= wieldDR;

    let wieldOutcome = null;

    if (isSuccess) {
      wieldOutcome = game.i18n.localize(isCrit ? "PB.InvokableRelicCriticalSuccess" : "PB.InvokableRelicSuccess");
    } else {
      wieldOutcome = game.i18n.localize(isFumble ? "PB.InvokableRelicFumble" : "PB.InvokableRelicFailure");
    }

    const rollResult = {
      item: item.data,
      actor: this.data,
      title: game.i18n.format("PB.InvokableTitle", {
        type: item.data.data.invokableType,
      }),
      wieldDR,
      wieldFormula: `1d20 + ${game.i18n.localize("PB.AbilitySpiritAbbrev")}`,
      wieldOutcome,
      wieldRoll
    };

    const html = await renderTemplate(WIELD_INVOKABLE_CARD_TEMPLATE, rollResult);

    await ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });

    if (isSuccess) {
      await this.useActionMacro(item.id);
    }
  }

  async invokeArcaneRitual(item) {
    if (this.data.data.powerUses.value < 1) {
      ui.notifications.warn(
        `${game.i18n.localize("PB.NoPowerUsesRemaining")}!`
      );
      return;
    }

    const wieldRoll = new Roll("d20+@abilities.spirit.value", this.getRollData());

    wieldRoll.evaluate({ async: false });
    await showDice(wieldRoll);

    const d20Result = wieldRoll.terms[0].results[0].result;
    const isFumble = d20Result === 1;
    const isCrit = d20Result === 20;
    const wieldDR = 12;
    const isSuccess = wieldRoll.total >= wieldDR;
    const isFailure = wieldRoll.total < wieldDR;

    let wieldOutcome = null;

    if (isSuccess) {
      wieldOutcome = game.i18n.localize(isCrit ? "PB.InvokableRitualCriticalSuccess" : "PB.InvokableRitualSuccess");
    } else {
      wieldOutcome = game.i18n.localize(isFumble ? "PB.InvokableRitualFumble" : "PB.InvokableRitualFailure");
    }

    const rollResult = {
      item: item.data,
      actor: this.data,
      title: game.i18n.format("PB.InvokableTitle", {
        type: item.data.data.invokableType,
      }),
      wieldDR,
      wieldFormula: `1d20 + ${game.i18n.localize("PB.AbilitySpiritAbbrev")}`,
      wieldOutcome,
      wieldRoll,
      isFailure,
      isFumble,
    };

    const html = await renderTemplate(WIELD_INVOKABLE_CARD_TEMPLATE, rollResult);

    await ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flags: {
        hasButton: isFailure || isFumble
      }
    });

    const newPowerUses = Math.max(0, this.data.data.powerUses.value - 1);
    await this.update({ ["data.powerUses.value"]: newPowerUses });

    if (isSuccess) {
      await this.useActionMacro(item.id);
    }
  }

  async rollMysticalMishap() {
    const pack = game.packs.get("pirateborg.rolls-gamemaster");
    const content = await pack.getDocuments();
    const table = content.find((i) => i.name === "Mystical Mishaps");
    const draw = await table.draw({displayChat: false});

    console.log(draw);

    const result = {
      title: game.i18n.format("PB.MysticalMishaps"),
      formula: '1d20',
      roll: draw.roll,
      items: draw.results
    }

    const html = await renderTemplate(MYSTICAL_MISHAP_CARD_TEMPLATE, result);

    await ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }

  async useActionMacro(itemId) {    
    const item = this.items.get(itemId);
    if (!item || !item.data.data.actionMacro) {
      return;
    }
    const [ compendium, macroName = null ] = item.data.data.actionMacro.split(';');
    if (compendium && macroName) {
      const macro = await findCompendiumItem(compendium, macroName);
      await executeMacro(macro, { actor: this, item });
    } else {
      const macro = game.macros.find((m) => m.name === macroName);
      await executeMacro(macro, { actor: this, item });      
    }
  }

  async _rollOutcome(
    dieRoll,
    rollData,
    cardTitle,
    outcomeTextFn,
    rollFormula = null
  ) {
    const roll = new Roll(dieRoll, rollData);
    roll.evaluate({ async: false });
    await showDice(roll);
    const rollResult = {
      cardTitle: cardTitle,
      outcomeText: outcomeTextFn(roll),
      roll,
      rollFormula: rollFormula ?? roll.formula,
    };
    const html = await renderTemplate(OUTCOME_ROLL_CARD_TEMPLATE, rollResult);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
    return roll;
  }

  async rollLuck() {
    const classItem = this.items.filter((x) => x.type === "class").pop();
    if (!classItem) {
      return;
    }
    const roll = await this._rollOutcome(
      "@luckDie",
      classItem.getRollData(),
      `${game.i18n.localize("PB.Luck")}`,
      (roll) => ` ${game.i18n.localize("PB.Luck")}: ${Math.max(0, roll.total)}`
    );
    const newLuck = Math.max(0, roll.total);
    await this.update({ ["data.luck"]: { max: newLuck, value: newLuck } });
  }

  async rollRitualPerDay() {
    const roll = await this._rollOutcome(
      "d4+@abilities.spirit.value",
      this.getRollData(),
      `${game.i18n.localize("PB.RitualRemaining")} ${game.i18n.localize("PB.PerDay")}`,
      (roll) =>
        ` ${game.i18n.localize("PB.PowerUsesRemaining")}: ${Math.max(
          0,
          roll.total
        )}`,
      `1d4 + ${game.i18n.localize("PB.AbilitySpiritAbbrev")}`
    );
    const newUses = Math.max(0, roll.total);
    await this.update({
      ["data.powerUses"]: { max: newUses, value: newUses },
    });
  }

  async rollExtraResourcePerDay() {
    const clazz = this.items.find((item) => item.type === CONFIG.PB.itemTypes.class)   
    if (clazz.data.data.useExtraResource) {
      const roll = await this._rollOutcome(
        clazz.data.data.extraResourceFormula,
        this.getRollData(),
        `${clazz.data.data.extraResourceNamePlural} ${game.i18n.localize("PB.PerDay")}`,
        (roll) =>
          ` ${game.i18n.localize("PB.PowerUsesRemaining")}: ${Math.max(
            0,
            roll.total
          )}`,
          clazz.data.data.extraResourceFormulaLabel
      );
      const newUses = Math.max(0, roll.total);
      await this.update({
        ["data.extraResourceUses"]: { max: newUses, value: newUses },
      });
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
    const result = {
      cardTitle: game.i18n.localize("PB.Rest"),
      outcomeText: game.i18n.localize("PB.NoEffect"),
    };
    const html = await renderTemplate(OUTCOME_ONLY_ROLL_CARD_TEMPLATE, result);
    await ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async rollHealHitPoints(dieRoll) {
    const roll = await this._rollOutcome(
      dieRoll,
      this.getRollData(),
      game.i18n.localize("PB.Rest"),
      (roll) =>
        `${game.i18n.localize("PB.Heal")} ${roll.total} ${game.i18n.localize(
          "PB.HP"
        )}`
    );
    const newHP = Math.min(
      this.data.data.hp.max,
      this.data.data.hp.value + roll.total
    );
    await this.update({ ["data.hp.value"]: newHP });
  }

  async rollStarvation() {
    const roll = await this._rollOutcome(
      "d4",
      this.getRollData(),
      game.i18n.localize("PB.Starvation"),
      (roll) =>
        `${game.i18n.localize("PB.Take")} ${roll.total} ${game.i18n.localize(
          "PB.Damage"
        )}`
    );
    const newHP = this.data.data.hp.value - roll.total;
    await this.update({ ["data.hp.value"]: newHP });
  }

  async rollInfection() {
    const roll = await this._rollOutcome(
      "d6",
      this.getRollData(),
      game.i18n.localize("PB.Infection"),
      (roll) =>
        `${game.i18n.localize("PB.Take")} ${roll.total} ${game.i18n.localize(
          "PB.Damage"
        )}`
    );
    const newHP = this.data.data.hp.value - roll.total;
    await this.update({ ["data.hp.value"]: newHP });
  }

  async getBetter() {

    const oldHp = this.data.data.hp.max;
    const newHp = this._betterHp(oldHp);
    const oldStr = this.data.data.abilities.strength.value;
    const newStr = this._betterAbility(oldStr);
    const oldAgi = this.data.data.abilities.agility.value;
    const newAgi = this._betterAbility(oldAgi);
    const oldPre = this.data.data.abilities.presence.value;
    const newPre = this._betterAbility(oldPre);
    const oldTou = this.data.data.abilities.toughness.value;
    const newTou = this._betterAbility(oldTou);
    const oldSpi = this.data.data.abilities.spirit.value;
    const newSpi = this._betterAbility(oldSpi);    
    let newSilver = this.data.data.silver;

    const hpOutcome = this._abilityOutcome(
      game.i18n.localize("PB.HP"),
      oldHp,
      newHp
    );
    const strOutcome = this._abilityOutcome(
      game.i18n.localize("PB.AbilityStrength"),
      oldStr,
      newStr
    );
    const agiOutcome = this._abilityOutcome(
      game.i18n.localize("PB.AbilityAgility"),
      oldAgi,
      newAgi
    );
    const preOutcome = this._abilityOutcome(
      game.i18n.localize("PB.AbilityPresence"),
      oldPre,
      newPre
    );
    const touOutcome = this._abilityOutcome(
      game.i18n.localize("PB.AbilityToughness"),
      oldTou,
      newTou
    );
    const spiOutcome = this._abilityOutcome(
      game.i18n.localize("PB.AbilitySpirit"),
      oldSpi,
      newSpi
    );

    // Left in the debris you find...
    let debrisOutcome = null;
    let relicOrRitual = null;
    const debrisRoll = new Roll("1d6", this.getRollData()).evaluate({
      async: false,
    });
    if (debrisRoll.total < 4) {
      debrisOutcome = "Nothing";
    } else if (debrisRoll.total === 4) {
      const silverRoll = new Roll("3d10", this.getRollData()).evaluate({
        async: false,
      });
      debrisOutcome = `${silverRoll.total} silver`;
      newSilver += silverRoll.total;
    } else if (debrisRoll.total === 5) {
      debrisOutcome = "an ancient relic";
      relicOrRitual = (await rollAncientRelics())[0];      
    } else {
      debrisOutcome = "an arcane ritual"
      relicOrRitual = (await rollArcaneRituals())[0];      
    }

    const gettingBetterItems = await handleClassGettingBetterRollTable(this);
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

    if (relicOrRitual) {
      await this.createEmbeddedDocuments('Item', [relicOrRitual.data]);    
    }

    await invokeGettingBetterMacro(this);
  }

  _betterHp(oldHp) {
    const hpRoll = new Roll("6d10", this.getRollData()).evaluate({
      async: false,
    });
    if (hpRoll.total >= oldHp) {
      // success, increase HP
      const howMuchRoll = new Roll("1d6", this.getRollData()).evaluate({
        async: false,
      });
      return oldHp + howMuchRoll.total;
    } else {
      // no soup for you
      return oldHp;
    }
  }

  _betterAbility(oldVal) {
    const roll = new Roll("1d6", this.getRollData()).evaluate({ async: false });
    if (roll.total === 1 || roll.total < oldVal) {
      // decrease, to a minimum of -3
      return Math.max(-3, oldVal - 1);
    } else {
      // increase, to a max of +6
      return Math.min(6, oldVal + 1);
    }
  }

  _abilityOutcome(abilityName, oldVal, newVal) {
    if (newVal < oldVal) {
      return `Lose ${oldVal - newVal} ${abilityName}`;
    } else if (newVal > oldVal) {
      return `Gain ${newVal - oldVal} ${abilityName}`;
    } else {
      return `${abilityName} unchanged`;
    }
  }

  async scvmify() {
    new ScvmDialog(this).render(true);
  }

  async rollBroken() {
    const table = await findCompendiumItem('pirateborg.rolls-gamemaster', 'Broken');
    const result = await table.draw({ displayChat: false })

    const data = {
      brokenRoll: result.roll,
      outcomes: result.results.map((r) => r.data.text),
    };

    const html = await renderTemplate(BROKEN_ROLL_CARD_TEMPLATE, data);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }
}
