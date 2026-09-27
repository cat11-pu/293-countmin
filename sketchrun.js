// sketchrun.js：按插入预算更新并留账，收尾把账插完
import { slotOf } from "./sketchrows.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function validWidth(width) {
  return Number.isInteger(width) && width > 0;
}

function cloneState(state, depth, width) {
  const given = (state && Array.isArray(state.rows)) ? state.rows : [];
  const rows = [];
  for (let row = 0; row < depth; row += 1) {
    if (given[row] && given[row].length === width) {
      rows.push(given[row].slice());
    } else {
      rows.push(new Array(width).fill(0));
    }
  }
  const ledger = state && Array.isArray(state.ledger) ? state.ledger.slice() : [];
  const applied = state && Array.isArray(state.applied) ? state.applied.slice() : [];
  return { rows: rows, ledger: ledger, applied: applied };
}

function insert(rows, name, depth, width) {
  for (let row = 0; row < depth; row += 1) {
    rows[row][slotOf(name, row, width)] += 1;
  }
}

export function step(spec) {
  spec = spec || {};
  const width = spec.width;
  const depth = Number.isInteger(spec.depth) && spec.depth >= 0 ? spec.depth : 0;
  if (!validWidth(width)) {
    throw fail("E_BAD_WIDTH", "width 必须是正整数");
  }
  const events = Array.isArray(spec.events) ? spec.events : [];
  for (const event of events) {
    if (!event || event.kind !== "add" || typeof event.name !== "string" || event.name === "") {
      if (event && event.kind !== "add") {
        throw fail("E_BAD_EVENT", "只认 kind=add 的事件");
      }
      throw fail("E_BAD_NAME", "名字不能为空");
    }
  }

  const state = cloneState(spec.state, depth, width);
  const seen = new Set(state.applied);
  const budget = Number.isInteger(spec.budget) && spec.budget >= 0 ? spec.budget : 0;
  let remaining = budget;
  let inserted = 0;
  let judged = 0;

  const carried = state.ledger.splice(0, state.ledger.length);
  const pending = [];
  for (const name of carried) {
    if (remaining > 0) {
      insert(state.rows, name, depth, width);
      remaining -= 1;
      inserted += 1;
    } else {
      pending.push(name);
    }
  }

  for (const event of events) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    state.applied.push(event.id);
    judged += 1;
    if (remaining > 0) {
      insert(state.rows, event.name, depth, width);
      remaining -= 1;
      inserted += 1;
    } else {
      pending.push(event.name);
    }
  }

  state.ledger = pending;
  return {
    state: state,
    inserted: inserted,
    ledger_before: pending.length,
    ledger: pending.slice(),
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  spec = spec || {};
  const width = spec.width;
  const depth = Number.isInteger(spec.depth) && spec.depth >= 0 ? spec.depth : 0;
  if (!validWidth(width)) {
    throw fail("E_BAD_WIDTH", "width 必须是正整数");
  }
  const state = cloneState(spec.state, depth, width);
  const pending = state.ledger.splice(0, state.ledger.length);
  let catchup = 0;
  for (const name of pending) {
    insert(state.rows, name, depth, width);
    catchup += 1;
  }
  return { state: state, catchup: catchup };
}
