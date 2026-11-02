import { test } from "node:test";
import assert from "node:assert/strict";
import { modifyDR } from "../module/api/dr-modifier.js";

test("modifyDR", () => {
  assert.deepEqual(modifyDR(12, 0, []), { dr: 12 });
  assert.deepEqual(
    modifyDR(12, 1, [
      { name: "Cursed", value: 2 },
      { name: "Blessed", value: -1 },
    ]),
    {
      dr: 13,
      drLabel: "12, +2 from Cursed, -1 from Blessed",
    },
  );
  assert.deepEqual(modifyDR(2, -5, [{ name: "Boon", value: -5 }]), { dr: -3, drLabel: "2, -5 from Boon" });
});
