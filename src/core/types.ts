export interface Cell {
  row: number;
  col: number;
  isBlack: boolean;
  number?: number;
  letter?: string; // The correct letter
  guess?: string;  // User's guess / hints
  slots: string[]; // Slot IDs
}

export interface Slot {
  id: string;
  direction: 'H' | 'V';
  length: number;
  cells: { row: number; col: number }[];
  pattern?: string;
}

export interface GridData {
  rows: number;
  cols: number;
  cells: Cell[][];
  slots: Slot[];
}

export type Mapping = Map<number, string>;
export type InverseMapping = Map<string, number>;
