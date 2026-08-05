import test from "node:test";
import assert from "node:assert/strict";

test("deliberate ZAC-87 frontend failure proof", () => {
  assert.fail("deliberate frontend quality-gate failure");
});
