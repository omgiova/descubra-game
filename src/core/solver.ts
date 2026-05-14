import type { GridData, Slot } from './types';
import { lexicon, generatePattern } from './lexicon';

export interface SolverOptions {
  maxSolutions?: number;
  enforceNumbers?: boolean;
  maxIterations?: number;
}

export class Solver {
  private grid: GridData;
  private options: SolverOptions;
  public solutions: string[][] = []; // Array of complete letter grids
  
  // Backtracking state
  private usedWords = new Set<string>();
  
  // For EnforceNumbers mode
  private numToLetter = new Map<number, string>();
  private letterToNum = new Map<string, number>();
  
  private iterations = 0;

  constructor(grid: GridData, options: SolverOptions = {}) {
    this.grid = grid;
    this.options = { maxSolutions: 1, enforceNumbers: false, maxIterations: 5000, ...options };
  }

  public solve(): string[][] {
    this.solutions = [];
    this.usedWords.clear();
    this.iterations = 0;
    
    // Initialize mapping with already revealed letters
    this.numToLetter.clear();
    this.letterToNum.clear();
    if (this.options.enforceNumbers) {
      for (const row of this.grid.cells) {
        for (const cell of row) {
          if (!cell.isBlack && cell.number !== undefined && cell.letter !== undefined) {
            this.numToLetter.set(cell.number, cell.letter);
            this.letterToNum.set(cell.letter, cell.number);
          }
        }
      }
    }
    
    this.backtrack();
    return this.solutions;
  }

  private backtrack() {
    if (this.solutions.length >= this.options.maxSolutions!) return;
    this.iterations++;
    if (this.iterations > this.options.maxIterations!) return;

    // Find the most constrained slot (MRV)
    let bestSlot: Slot | null = null;
    let bestCandidates: string[] = [];
    let minCandidates = Infinity;

    let allAssigned = true;

    for (const slot of this.grid.slots) {
      // Check if fully assigned
      let fullyAssigned = true;
      for (const pos of slot.cells) {
        if (!this.grid.cells[pos.row][pos.col].letter) {
          fullyAssigned = false;
          break;
        }
      }

      if (fullyAssigned) continue;
      
      allAssigned = false;

      const candidates = this.getCandidates(slot);
      if (candidates.length === 0) return; // Dead end

      if (candidates.length < minCandidates) {
        minCandidates = candidates.length;
        bestSlot = slot;
        bestCandidates = candidates;
      }
    }

    if (allAssigned) {
      this.solutions.push(this.captureGrid());
      return;
    }

    if (!bestSlot) return;

    // Try candidates
    // Randomize candidates slightly to get different grids during generation
    if (!this.options.enforceNumbers) {
        bestCandidates.sort(() => Math.random() - 0.5);
    }

    for (const word of bestCandidates) {
      if (this.usedWords.has(word)) continue;

      this.usedWords.add(word);
      const undoLog = this.applyWord(bestSlot, word);
      
      if (undoLog !== null) { // Valid application
        this.backtrack();
        this.undo(undoLog);
      }
      this.usedWords.delete(word);
    }
  }

  private getCandidates(slot: Slot): string[] {
    let currentPattern = '';
    for (const pos of slot.cells) {
      const letter = this.grid.cells[pos.row][pos.col].letter;
      currentPattern += letter || '.';
    }

    let expectedSignature: string | null = null;
    if (this.options.enforceNumbers) {
      const numbers = slot.cells.map(pos => this.grid.cells[pos.row][pos.col].number);
      if (numbers.every(n => n !== undefined)) {
        expectedSignature = generatePattern(numbers as number[]);
      }
    }

    const lengthCandidates = lexicon.getWordsByLength(slot.length);
    const valid = [];
    
    for (const word of lengthCandidates) {
      if (expectedSignature && generatePattern(word.split('')) !== expectedSignature) {
        continue;
      }
      
      let match = true;
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (currentPattern[i] !== '.' && currentPattern[i] !== char) {
          match = false;
          break;
        }
        
        // If enforceNumbers, check bijection constraints
        if (this.options.enforceNumbers) {
            const pos = slot.cells[i];
            const num = this.grid.cells[pos.row][pos.col].number;
            if (num !== undefined) {
                const mappedLetter = this.numToLetter.get(num);
                if (mappedLetter !== undefined && mappedLetter !== char) {
                    match = false; break;
                }
                const mappedNum = this.letterToNum.get(char);
                if (mappedNum !== undefined && mappedNum !== num) {
                    match = false; break;
                }
            }
        }
      }
      if (match) valid.push(word);
    }
    
    return valid;
  }

  private applyWord(slot: Slot, word: string): any {
    const addedLetters: {row: number, col: number}[] = [];
    const addedMappings: {num: number, letter: string}[] = [];

    for (let i = 0; i < word.length; i++) {
      const pos = slot.cells[i];
      const cell = this.grid.cells[pos.row][pos.col];
      const char = word[i];

      if (!cell.letter) {
        cell.letter = char;
        addedLetters.push(pos);
      }

      if (this.options.enforceNumbers && cell.number !== undefined) {
          if (!this.numToLetter.has(cell.number)) {
              this.numToLetter.set(cell.number, char);
              this.letterToNum.set(char, cell.number);
              addedMappings.push({num: cell.number, letter: char});
          }
      }
    }

    return { addedLetters, addedMappings };
  }

  private undo(log: any) {
    for (const pos of log.addedLetters) {
      this.grid.cells[pos.row][pos.col].letter = undefined;
    }
    for (const map of log.addedMappings) {
      this.numToLetter.delete(map.num);
      this.letterToNum.delete(map.letter);
    }
  }

  private captureGrid(): string[] {
    const res: string[] = [];
    for (const row of this.grid.cells) {
      let str = '';
      for (const cell of row) {
        str += cell.isBlack ? '#' : (cell.letter || '.');
      }
      res.push(str);
    }
    return res;
  }
}
