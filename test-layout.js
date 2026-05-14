function isValidLayout(layout) {
  const size = layout.length;
  for (let r = 0; r < size; r++) {
    let len = 0;
    for (let c = 0; c <= size; c++) {
      if (c < size && layout[r][c] === 1) len++;
      else { if (len === 1 || len === 2) return false; len = 0; }
    }
  }
  for (let c = 0; c < size; c++) {
    let len = 0;
    for (let r = 0; r <= size; r++) {
      if (r < size && layout[r][c] === 1) len++;
      else { if (len === 1 || len === 2) return false; len = 0; }
    }
  }
  return true;
}
function generateRandomLayout(size = 8, density = 0.20) {
  const layout = Array.from({ length: size }, () => Array(size).fill(1));
  const targetBlacks = Math.floor(size * size * density);
  let blacks = 0;
  let attempts = 0;
  while (blacks < targetBlacks && attempts < 100) {
    attempts++;
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (layout[r][c] === 0) continue;
    const symR = size - 1 - r;
    const symC = size - 1 - c;
    layout[r][c] = 0; layout[symR][symC] = 0;
    if (!isValidLayout(layout)) {
      layout[r][c] = 1; layout[symR][symC] = 1;
    } else {
      blacks += (r === symR && c === symC) ? 1 : 2;
      attempts = 0;
    }
  }
  return {layout, blacks};
}
console.log(generateRandomLayout(10, 0.25).layout.map(row => row.join(' ')).join('\n'));
