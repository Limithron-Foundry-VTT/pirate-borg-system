import { actorPartyInitiativeAction } from "../api/action/actor/actor-party-initiative-action.js";
import { SIDE, partyGoesFirst } from "./combat-order.js";
import { toCombatantInfo } from "./combatant.js";

const { CombatTracker } = foundry.applications.sidebar.tabs;

/**
 * @param {String} tag
 * @param {String} className
 * @param {String} [text]
 * @returns {HTMLElement}
 */
const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

/**
 * Adds Pirate Borg side based combat and ship crew strips to the core tracker.
 */
export class PBCombatTracker extends CombatTracker {
  /** @inheritDoc */
  async _prepareTurnContext(combat, combatant, index) {
    const turn = await super._prepareTurnContext(combat, combatant, index);
    if (!combat.usesSideBasedCombat) return turn;
    // The acting block gets a left edge instead of core's full-row highlight.
    const acting = combat.started && combat.getActiveBlock().includes(combatant);
    turn.css = [turn.css.replace(/\bactive\b/, "").trim(), acting ? "pb-acting" : null, "pb-side-based"].filterJoin(" ");
    return turn;
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    const combat = this.viewed;
    const list = this.element.querySelector("ol.combat-tracker");
    if (!combat || !list) return;
    this.element.querySelectorAll(".pb-party-roll, .pb-party-order, .pb-block-header, .pb-crew").forEach((element) => element.remove());
    if (combat.usesSideBasedCombat) {
      this.#renderPartyInitiative(combat);
      this.#renderBlockHeaders(combat, list);
    }
    for (const row of list.querySelectorAll("li.combatant")) {
      const actor = combat.combatants.get(row.dataset.combatantId)?.actor;
      if (!actor?.isAnyVehicle) continue;
      row.classList.add("pb-ship");
      this.#renderCrew(actor, row);
    }
  }

  /**
   * Replaces core's Roll All / Roll NPCs with a party roll button showing the rolled face, and shows who goes first under the round.
   * @param {PBCombat} combat
   */
  #renderPartyInitiative(combat) {
    const party = combat.partyInitiative;
    const order = party
      ? game.i18n.localize(partyGoesFirst(party) ? "PB.InitiativePlayerCharactersBegin" : "PB.InitiativeEnemiesBegin")
      : game.i18n.localize("PB.PartyInitiativeNotRolled");
    this.element.querySelector(".encounter-title")?.append(createElement("span", "pb-party-order", order));

    const controls = this.element.querySelector(".encounter-controls .control-buttons.left");
    if (!controls) return;
    // Keep two slots so the round title stays centred.
    const [first, second] = controls.children;
    second?.replaceWith(createElement("div", "spacer"));
    if (!(game.user.isGM || combat.combatants.some((c) => c.isOwner))) {
      first?.replaceWith(createElement("div", "spacer"));
      return;
    }
    const face = ["one", "two", "three", "four", "five", "six"][party - 1] ?? "d6";
    const button = createElement("button", `inline-control combat-control icon fa-solid fa-dice-${face} pb-party-roll`);
    button.type = "button";
    button.dataset.tooltip = party ? `${game.i18n.localize("PB.PartyInitiative")}: ${party} · ${order}` : game.i18n.localize("PB.RollPartyInitiative");
    button.ariaLabel = game.i18n.localize("PB.RollPartyInitiative");
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      actorPartyInitiativeAction(combat);
    });
    first?.replaceWith(button);
  }

  /**
   * @param {PBCombat} combat
   * @param {HTMLOListElement} list
   */
  #renderBlockHeaders(combat, list) {
    // Headers come from the rendered rows so hidden combatants (skipped for players) don't break the blocks.
    const rows = [...list.querySelectorAll("li.combatant")]
      .map((row) => ({ row, combatant: combat.combatants.get(row.dataset.combatantId) }))
      .filter(({ combatant }) => combatant)
      .map(({ row, combatant }) => ({ row, side: toCombatantInfo(combatant).side }));
    const order = partyGoesFirst(combat.partyInitiative) ? [SIDE.PARTY, SIDE.ENEMY] : [SIDE.ENEMY, SIDE.PARTY];
    const activeSide = combat.started && combat.combatant ? toCombatantInfo(combat.combatant).side : null;
    order.forEach((side, index) => {
      const firstRow = rows.find((entry) => entry.side === side)?.row;
      const acting = side === activeSide;
      if (!firstRow && !acting) return;
      const title = game.i18n.localize(side === SIDE.PARTY ? "PB.Players" : "PB.Enemies");
      const header = createElement("li", `pb-block-header${acting ? " pb-acting" : ""}`);
      header.append(createElement("span", "pb-block-title", title));
      if (side === SIDE.PARTY && combat.partyInitiative) {
        const roll = createElement("span", "pb-block-roll", String(combat.partyInitiative));
        roll.dataset.tooltip = game.i18n.localize("PB.PartyInitiative");
        header.append(roll);
      }
      if (firstRow) firstRow.before(header);
      else if (index === 0) list.prepend(header);
      else list.append(header);
    });
  }

  /**
   * @param {PBActor} ship
   * @param {HTMLLIElement} row
   */
  #renderCrew(ship, row) {
    if (!ship.testUserPermission(game.user, "OBSERVER")) return;
    const captainId = ship.captain;
    const members = [...new Set(ship.crews ?? [])]
      .map((id) => game.actors.get(id))
      .filter(Boolean)
      .sort((a, b) => (b.id === captainId) - (a.id === captainId));
    if (!members.length) return;
    const strip = createElement("div", "pb-crew");
    for (const member of members) {
      strip.append(this.#createCrewPortrait(member, member.id === captainId));
    }
    row.querySelector(".token-name")?.append(strip);
  }

  /**
   * @param {PBActor} member
   * @param {Boolean} isCaptain
   * @returns {HTMLSpanElement}
   */
  #createCrewPortrait(member, isCaptain) {
    const portrait = createElement("span", `pb-crew-member${isCaptain ? " captain" : ""}`);
    const img = createElement("img", "");
    img.src = member.prototypeToken?.texture?.src || member.img;
    img.alt = "";
    portrait.append(img);
    if (member.testUserPermission(game.user, "LIMITED")) {
      img.alt = member.name;
      portrait.dataset.tooltip = member.name;
      portrait.classList.add("viewable");
      portrait.addEventListener("click", (event) => {
        event.stopPropagation();
        member.sheet.render({ force: true });
      });
    }
    return portrait;
  }

  /** Crew visibility follows actor access, so re-render when it changes. */
  static registerHooks() {
    Hooks.on("updateActor", (actor, changes) => {
      if ("ownership" in changes) ui.combat?.render();
    });
  }
}
