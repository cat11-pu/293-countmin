// sketchrun.js：按插入预算更新并留账
import { slotOf, estimateOf } from "./sketchrows.js";

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function copyState(state, width, depth) {
  const source = state || {};
  let rows = Array.isArray(source.rows) && source.rows.length
    ? source.rows.map(function (row) { return row.slice(); })
    : [];
  if (!rows.length && depth > 0 && width > 0) {
    for (let row = 0; row < depth; row += 1) {
      rows.push(new Array(width).fill(0));
    }
  }
  return {
    rows: rows,
    ledger: Array.isArray(source.ledger) ? source.ledger.slice() : [],
    applied: Array.isArray(source.applied) ? source.applied.slice() : []
  };
}

function insert(rows, name, width) {
  for (let row = 0; row < rows.length; row += 1) {
    rows[row][slotOf(name, row, width)] += 1;
  }
}

export function step(spec) {
  const width = spec.width;
  const widthCode = spec.width_error_code || "E_BAD_WIDTH";
  const nameCode = spec.name_error_code || "E_BAD_NAME";
  const eventCode = spec.event_error_code || "E_BAD_EVENT";
  if (!Number.isInteger(width) || width <= 0) {
    fail(widthCode, "行宽不是正整数");
  }
  const events = Array.isArray(spec.events) ? spec.events : [];
  const budget = Number.isInteger(spec.budget) && spec.budget > 0 ? spec.budget : 0;
  const state = copyState(spec.state, width, spec.depth || 0);
  let inserted = 0;
  let judged = 0;
  for (const event of events) {
    if (event && (state.applied.includes(event.id) || state.applied.includes(event.name))) {
      continue;
    }
    if (!event || typeof event !== "object" || event.kind !== "add") {
      fail(eventCode, "事件不合法");
    }
    if (typeof event.name !== "string" || event.name.length === 0) {
      fail(nameCode, "名字为空");
    }
    judged += 1;
    if (inserted < budget) {
      insert(state.rows, event.name, width);
      state.applied.push(event.id);
      inserted += 1;
    } else {
      state.ledger.push(event.name);
    }
  }
  return {
    state: state,
    inserted: inserted,
    ledger_before: state.ledger.length,
    ledger: state.ledger.slice(),
    judged: judged,
    judged_bound: events.length
  };
}

export function close(spec) {
  const width = spec.width;
  const widthCode = spec.width_error_code || "E_BAD_WIDTH";
  if (!Number.isInteger(width) || width <= 0) {
    fail(widthCode, "行宽不是正整数");
  }
  const state = copyState(spec.state, width, spec.depth || 0);
  let catchup = 0;
  while (state.ledger.length) {
    const name = state.ledger.shift();
    insert(state.rows, name, width);
    state.applied.push(name);
    catchup += 1;
  }
  return {
    state: state,
    catchup: catchup,
    queries: (spec.queries || []).map(function (name) {
      return [name, estimateOf(state.rows, name, width)];
    })
  };
}
