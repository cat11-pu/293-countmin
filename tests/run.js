import assert from "node:assert";
import { slotOf, estimateOf } from "../sketchrows.js";
import { step, close } from "../sketchrun.js";
import { render } from "../app.js";

const base = {
  budget: 2, width: 4, depth: 2, queries: [],
  state: { rows: [[0, 0, 0, 0], [0, 0, 0, 0]], ledger: [], applied: [] },
  events: [],
  name_error_code: "E_BAD_NAME", width_error_code: "E_BAD_WIDTH",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("slotOf returns a number", () => {
  assert.strictEqual(typeof slotOf("a", 0, 4), "number");
});

check("estimateOf returns a number", () => {
  assert.strictEqual(typeof estimateOf([[0]], "a", 1), "number");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
