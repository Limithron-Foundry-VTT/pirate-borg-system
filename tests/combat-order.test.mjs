import { test } from "node:test";
import assert from "node:assert/strict";
import {
  KIND,
  MODE,
  SIDE,
  compareCombatants,
  getBlockRange,
  getCombatKind,
  getNextBlockStart,
  getPreviousBlockStart,
  partyGoesFirst,
  usesSideBasedCombat,
} from "../module/system/combat-order.js";

const info = (id, { name = id, initiative = null, isShip = false, side = SIDE.ENEMY } = {}) => ({ id, name, initiative, isShip, side });
const order = (infos, opts) => [...infos].sort((a, b) => compareCombatants(a, b, opts)).map((c) => c.id);
const permutations = (xs) => (xs.length ? xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])) : [[]]);
const stableOrder = (infos, opts) => new Set(permutations(infos).map((p) => order(p, opts).join(",")));

test("combat kind is ship when any combatant is a ship", () => {
  assert.equal(getCombatKind([info("a"), info("s", { isShip: true })]), KIND.SHIP);
  assert.equal(getCombatKind([info("a"), info("b")]), KIND.CREW);
  assert.equal(getCombatKind([]), KIND.CREW);
});

test("party goes first on 4-6 and before any roll, enemies on 1-3", () => {
  assert.equal(partyGoesFirst(undefined), true);
  assert.equal(partyGoesFirst(null), true);
  for (const n of [1, 2, 3]) assert.equal(partyGoesFirst(n), false);
  for (const n of [4, 5, 6]) assert.equal(partyGoesFirst(n), true);
});

test("side based combat only for crew combat in side mode", () => {
  assert.equal(usesSideBasedCombat(KIND.CREW, MODE.SIDE), true);
  assert.equal(usesSideBasedCombat(KIND.CREW, MODE.INDIVIDUAL), false);
  assert.equal(usesSideBasedCombat(KIND.SHIP, MODE.SIDE), false);
});

test("ships: highest initiative first, friendly ship wins ties, any input order", () => {
  const infos = [
    info("enemyShip", { isShip: true, initiative: 5 }),
    info("pcShip", { isShip: true, initiative: 5, side: SIDE.PARTY }),
    info("slow", { isShip: true, initiative: 2 }),
    info("fast", { isShip: true, initiative: 7 }),
  ];
  const opts = { kind: KIND.SHIP, mode: MODE.SIDE };
  assert.deepEqual([...stableOrder(infos, opts)], ["fast,pcShip,enemyShip,slow"]);
});

test("mixed combat: ships before crew, crew by initiative", () => {
  const infos = [info("crew", { initiative: 9 }), info("ship", { isShip: true, initiative: 1 })];
  assert.deepEqual(order(infos, { kind: KIND.SHIP, mode: MODE.SIDE }), ["ship", "crew"]);
});

test("side mode: party block first on 4-6, enemy block first on 1-3, by name within a block", () => {
  const infos = [
    info("e2", { name: "Zed" }),
    info("p1", { name: "Bea", side: SIDE.PARTY }),
    info("e1", { name: "Abe" }),
    info("p2", { name: "Al", side: SIDE.PARTY }),
  ];
  const base = { kind: KIND.CREW, mode: MODE.SIDE };
  assert.deepEqual([...stableOrder(infos, { ...base, partyInitiative: 5 })], ["p2,p1,e1,e2"]);
  assert.deepEqual([...stableOrder(infos, { ...base, partyInitiative: 2 })], ["e1,e2,p2,p1"]);
  assert.deepEqual([...stableOrder(infos, { ...base, partyInitiative: undefined })], ["p2,p1,e1,e2"]);
});

test("individual mode: initiative desc, party wins ties, unrolled last", () => {
  const infos = [info("e", { initiative: 4 }), info("p", { initiative: 4, side: SIDE.PARTY }), info("u"), info("hi", { initiative: 8 })];
  assert.deepEqual([...stableOrder(infos, { kind: KIND.CREW, mode: MODE.INDIVIDUAL })], ["hi,p,e,u"]);
});

test("duplicate names fall back to id so the order is total", () => {
  const infos = [info("b", { name: "Goblin" }), info("a", { name: "Goblin" })];
  assert.deepEqual([...stableOrder(infos, { kind: KIND.CREW, mode: MODE.SIDE })], ["a,b"]);
});

test("block navigation", () => {
  const infos = [info("p1", { side: SIDE.PARTY }), info("p2", { side: SIDE.PARTY }), info("e1"), info("e2"), info("e3")];
  assert.deepEqual(getBlockRange(infos, 1), { start: 0, end: 1 });
  assert.deepEqual(getBlockRange(infos, 3), { start: 2, end: 4 });
  assert.equal(getNextBlockStart(infos, null), 0);
  assert.equal(getNextBlockStart(infos, 0), 2);
  assert.equal(getNextBlockStart(infos, 1), 2);
  assert.equal(getNextBlockStart(infos, 2), null);
  assert.equal(getPreviousBlockStart(infos, 4), 0);
  assert.equal(getPreviousBlockStart(infos, 1), null);
  assert.equal(getNextBlockStart([info("e1"), info("e2")], 0), null);
});
