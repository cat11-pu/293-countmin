// sketchrows.js：落格与取最小
export function slotOf(name, row, width) {
  let sum = 0;
  const text = String(name);
  for (let spot = 0; spot < text.length; spot += 1) {
    sum += text.charCodeAt(spot);
  }
  return (sum * (row + 1) + row) % width;
}

export function estimateOf(rows, name, width) {
  let best = Infinity;
  for (let row = 0; row < rows.length; row += 1) {
    const count = rows[row][slotOf(name, row, width)];
    if (count < best) best = count;
  }
  return best === Infinity ? 0 : best;
}
