import { test } from "node:test";
import assert from "node:assert/strict";
import { luckDieFormula } from "../module/api/luck/luck-die.js";

test("no modifiers returns the die unchanged", () => {
  assert.equal(luckDieFormula({ die: "1d2" }), "1d2");
  assert.equal(luckDieFormula({ die: "" }), "");
});

test("result modifier is added to the roll, not the faces", () => {
  assert.equal(luckDieFormula({ die: "1d2", resultModifier: 2 }), "1d2+2");
  assert.equal(luckDieFormula({ die: "1d4", resultModifier: "-1" }), "1d4-1");
});

test("size modifier steps through standard dice and keeps the dice count", () => {
  assert.equal(luckDieFormula({ die: "1d2", sizeModifier: 1 }), "1d4");
  assert.equal(luckDieFormula({ die: "1d2", sizeModifier: 2 }), "1d6");
  assert.equal(luckDieFormula({ die: "2d4", sizeModifier: "1" }), "2d6");
  assert.equal(luckDieFormula({ die: "d6", sizeModifier: -1 }), "d4");
  assert.equal(luckDieFormula({ die: "1d12", sizeModifier: 1 }), "1d20");
  assert.equal(luckDieFormula({ die: "1d100", sizeModifier: 3 }), "1d100");
});

test("non-standard dice land on the nearest standard die in the step direction", () => {
  assert.equal(luckDieFormula({ die: "1d3", sizeModifier: 1 }), "1d4");
  assert.equal(luckDieFormula({ die: "1d3", sizeModifier: -1 }), "1d2");
  assert.equal(luckDieFormula({ die: "1d5", sizeModifier: 2 }), "1d8");
});

test("size modifier down to d0 means no luck, ignoring the result modifier", () => {
  assert.equal(luckDieFormula({ die: "1d2", sizeModifier: -1, resultModifier: 2 }), "0");
  assert.equal(luckDieFormula({ die: "1d2", sizeModifier: -5 }), "0");
});

test("size then result modifier", () => {
  assert.equal(luckDieFormula({ die: "1d6", sizeModifier: 1, resultModifier: 1 }), "1d8+1");
});
