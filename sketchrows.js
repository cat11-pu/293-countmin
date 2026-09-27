// sketchrows.js：落格与取最小
export function slotOf(name, row, width) {
  let sum = 0;
  for (const ch of String(name)) {
    sum += ch.charCodeAt(0);
  }
  return (sum * (row + 1) + row) % width;
}

export function estimateOf(rows, name, width) {
  let best = Infinity;
  for (let row = 0; row < rows.length; row += 1) {
    const value = rows[row][slotOf(name, row, width)];
    if (value < best) best = value;
  }
  return best === Infinity ? 0 : best;
}
