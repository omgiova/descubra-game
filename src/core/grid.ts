import type { Cell, GridData, Slot } from './types';

export function createGrid(layout: number[][]): GridData {
  const rows = layout.length;
  const cols = layout[0].length;
  const cells: Cell[][] = [];

  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = {
        row: r,
        col: c,
        isBlack: layout[r][c] === 0,
        slots: []
      };
    }
  }

  const slots: Slot[] = [];

  // Extract Horizontal Slots
  for (let r = 0; r < rows; r++) {
    let startCol = -1;
    for (let c = 0; c <= cols; c++) {
      if (c < cols && !cells[r][c].isBlack) {
        if (startCol === -1) startCol = c;
      } else {
        if (startCol !== -1) {
          const length = c - startCol;
          if (length >= 4) { 
            const id = `H-${r}-${startCol}`;
            const slotCells = [];
            for (let i = startCol; i < c; i++) {
              slotCells.push({ row: r, col: i });
              cells[r][i].slots.push(id);
            }
            slots.push({
              id,
              direction: 'H',
              length,
              cells: slotCells
            });
          }
          startCol = -1;
        }
      }
    }
  }

  // Extract Vertical Slots
  for (let c = 0; c < cols; c++) {
    let startRow = -1;
    for (let r = 0; r <= rows; r++) {
      if (r < rows && !cells[r][c].isBlack) {
        if (startRow === -1) startRow = r;
      } else {
        if (startRow !== -1) {
          const length = r - startRow;
          if (length >= 4) {
            const id = `V-${startRow}-${c}`;
            const slotCells = [];
            for (let i = startRow; i < r; i++) {
              slotCells.push({ row: i, col: c });
              cells[i][c].slots.push(id);
            }
            slots.push({ id, direction: 'V', length, cells: slotCells });
          }
          startRow = -1;
        }
      }
    }
  }

  return { rows, cols, cells, slots };
}
