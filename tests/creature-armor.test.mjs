import { test } from "node:test";
import assert from "node:assert/strict";
import { creatureArmorUpdate } from "../module/system/migrate-creature-armor.js";

const creature = ({ id = "someNewId0000000", formula, armorDescription = "", description = "", compendiumSource, sourceId, type = "creature" }) => ({
  type,
  id,
  _stats: { compendiumSource },
  flags: sourceId ? { core: { sourceId } } : {},
  system: { description, attributes: { armor: { formula, description: armorDescription } } },
});

test("known creature imported via the adventure (same id) is fixed", () => {
  assert.deepEqual(creatureArmorUpdate(creature({ id: "wt6XrxYFPNqSGChR", formula: "-d2" })), { "system.attributes.armor.formula": "1d2" });
  assert.deepEqual(creatureArmorUpdate(creature({ id: "rHFOLCLa1ifuTt0X", formula: "–" })), { "system.attributes.armor.formula": "0" });
});

test("known creature imported from a compendium (new id, source recorded) is fixed", () => {
  const fromPack = creature({ formula: "-d6", compendiumSource: "Compendium.pirate-borg-down-among-the-dead.adventure.Actor.zO3C1npdHeoo2t2G" });
  assert.deepEqual(creatureArmorUpdate(fromPack), { "system.attributes.armor.formula": "1d6" });
  const legacy = creature({ formula: "-d4", sourceId: "Compendium.x.y.Actor.pMi1UBKTUywgNXVG" });
  assert.deepEqual(creatureArmorUpdate(legacy), { "system.attributes.armor.formula": "1d4" });
});

test("known creature the GM has already changed is left alone", () => {
  assert.equal(creatureArmorUpdate(creature({ id: "wt6XrxYFPNqSGChR", formula: "1d2" })), null);
  assert.equal(creatureArmorUpdate(creature({ id: "wt6XrxYFPNqSGChR", formula: "-d4" })), null);
});

test("custom creature with negative armor is left alone", () => {
  assert.equal(creatureArmorUpdate(creature({ formula: "-d4", armorDescription: "Rotten hide" })), null);
  assert.equal(creatureArmorUpdate(creature({ formula: "-d2", armorDescription: "Leather armor" })), null);
});

test("generated pirates are fixed, including the Chain shirt typo", () => {
  const description = "<p><strong>Name:</strong> Thomas</p><p><strong>Nickname:</strong> Red Heart</p>";
  assert.deepEqual(creatureArmorUpdate(creature({ formula: "-d4", armorDescription: "Chain shit", description })), {
    "system.attributes.armor.formula": "1d4",
    "system.attributes.armor.description": "Chain shirt",
  });
  assert.deepEqual(creatureArmorUpdate(creature({ formula: "-d2", armorDescription: "Leather armor", description })), {
    "system.attributes.armor.formula": "1d2",
    "system.attributes.armor.description": "Leather armor",
  });
});

test("non-creatures are ignored", () => {
  assert.equal(creatureArmorUpdate(creature({ id: "wt6XrxYFPNqSGChR", formula: "-d2", type: "character" })), null);
});
