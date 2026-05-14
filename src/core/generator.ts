import { createGrid } from './grid';
import { Solver } from './solver';
import { lexicon } from './lexicon';
import type { GridData } from './types';

const MAX_ROWS = 15;

export function generateScrabbleLayout(words: string[], targetWords = 15, gridSize = 20): { layout: number[][], filled: string[][] } | null {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(' '));
  const placed: { word: string, r: number, c: number, dir: 'H'|'V' }[] = [];
  
  const canPlace = (word: string, r: number, c: number, dir: 'H'|'V'): boolean => {
    if (dir === 'H') {
      if (c < 0 || c + word.length > gridSize || r < 0 || r >= gridSize) return false;
      if (c - 1 >= 0 && grid[r][c - 1] !== ' ') return false;
      if (c + word.length < gridSize && grid[r][c + word.length] !== ' ') return false;
      
      for (let i = 0; i < word.length; i++) {
        const char = grid[r][c + i];
        if (char !== ' ' && char !== word[i]) return false;
        if (char === ' ') {
          if (r - 1 >= 0 && grid[r - 1][c + i] !== ' ') return false;
          if (r + 1 < gridSize && grid[r + 1][c + i] !== ' ') return false;
        }
      }
    } else {
      if (r < 0 || r + word.length > gridSize || c < 0 || c >= gridSize) return false;
      if (r - 1 >= 0 && grid[r - 1][c] !== ' ') return false;
      if (r + word.length < gridSize && grid[r + word.length][c] !== ' ') return false;
      
      for (let i = 0; i < word.length; i++) {
        const char = grid[r + i][c];
        if (char !== ' ' && char !== word[i]) return false;
        if (char === ' ') {
          if (c - 1 >= 0 && grid[r + i][c - 1] !== ' ') return false;
          if (c + 1 < gridSize && grid[r + i][c + 1] !== ' ') return false;
        }
      }
    }
    return true;
  };

  const place = (word: string, r: number, c: number, dir: 'H'|'V') => {
    for (let i = 0; i < word.length; i++) {
      if (dir === 'H') grid[r][c + i] = word[i];
      else grid[r + i][c] = word[i];
    }
    placed.push({ word, r, c, dir });
  };

  const firstWord = words[Math.floor(Math.random() * words.length)];
  const startR = Math.floor(gridSize / 2);
  const startC = Math.floor((gridSize - firstWord.length) / 2);
  place(firstWord, startR, startC, 'H');

  let attempts = 0;
  while (placed.length < targetWords && attempts < 2000) {
    attempts++;
    
    // Pick a random placed word to branch from
    const base = placed[Math.floor(Math.random() * placed.length)];
    const letterIdx = Math.floor(Math.random() * base.word.length);
    const letter = base.word[letterIdx];
    const intersectR = base.dir === 'H' ? base.r : base.r + letterIdx;
    const intersectC = base.dir === 'H' ? base.c + letterIdx : base.c;
    
    // Find words containing this letter
    let bestWord = '';
    let bestLetterIdx = -1;
    let maxIntersections = -1;
    
    for (let i = 0; i < 50; i++) {
      const w = words[Math.floor(Math.random() * words.length)];
      if (w === base.word) continue;
      
      const idx = w.indexOf(letter);
      if (idx !== -1) {
        const newDir = base.dir === 'H' ? 'V' : 'H';
        const newR = newDir === 'H' ? intersectR : intersectR - idx;
        const newC = newDir === 'H' ? intersectC - idx : intersectC;
        
        if (canPlace(w, newR, newC, newDir)) {
          // Count intersections this placement would make
          let intersections = 0;
          for (let j = 0; j < w.length; j++) {
            const r = newDir === 'H' ? newR : newR + j;
            const c = newDir === 'H' ? newC + j : newC;
            if (grid[r][c] === w[j]) intersections++;
          }
          
          if (intersections > maxIntersections) {
            maxIntersections = intersections;
            bestWord = w;
            bestLetterIdx = idx;
          }
        }
      }
    }

    if (bestWord) {
      const newDir = base.dir === 'H' ? 'V' : 'H';
      const newR = newDir === 'H' ? intersectR : intersectR - bestLetterIdx;
      const newC = newDir === 'H' ? intersectC - bestLetterIdx : intersectC;
      place(bestWord, newR, newC, newDir);
      attempts = 0;
    }
  }

  if (placed.length < 5) return null;

  let minR = gridSize, maxR = 0, minC = gridSize, maxC = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] !== ' ') {
        minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        minC = Math.min(minC, c); maxC = Math.max(maxC, c);
      }
    }
  }

  // No extra padding — keep grid tight
  const croppedRows = maxR - minR + 1;
  if (croppedRows > MAX_ROWS) return null; // Reject if too tall

  const croppedLayout: number[][] = [];
  const croppedFilled: string[][] = [];
  for (let r = minR; r <= maxR; r++) {
    const layoutRow: number[] = [];
    const filledRow: string[] = [];
    for (let c = minC; c <= maxC; c++) {
      if (grid[r][c] === ' ') {
        layoutRow.push(0);
        filledRow.push('.');
      } else {
        layoutRow.push(1);
        filledRow.push(grid[r][c]);
      }
    }
    croppedLayout.push(layoutRow);
    croppedFilled.push(filledRow);
  }

  return { layout: croppedLayout, filled: croppedFilled };
}

export async function generatePuzzle(): Promise<GridData> {
  let layout: number[][] = [];
  let filledString: string[][] = [];
  
  while (true) {
    const res = generateScrabbleLayout(Array.from(lexicon.words), 10, 20);
    if (res) {
      layout = res.layout;
      filledString = res.filled;
      break;
    }
  }
  
  const grid = createGrid(layout);
  
  const lettersUsed = new Set<string>();
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (!grid.cells[r][c].isBlack) {
        const char = filledString[r][c];
        grid.cells[r][c].letter = char;
        lettersUsed.add(char);
      }
    }
  }
  
  // Step 2: Encode mapping
  const lettersArray = Array.from(lettersUsed);
  const numbers = Array.from({length: 26}, (_, i) => i + 1);
  numbers.sort(() => Math.random() - 0.5);
  
  const charToNum = new Map<string, number>();
  for (let i = 0; i < lettersArray.length; i++) {
    charToNum.set(lettersArray[i], numbers[i]);
  }
  
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (!grid.cells[r][c].isBlack) {
        const char = grid.cells[r][c].letter!;
        grid.cells[r][c].number = charToNum.get(char)!;
      }
    }
  }
  
  // Step 3: Verify uniqueness
  let hintsRevealed = 0;
  // Reveal at least 1 hint to start
  revealRandomHint(grid);
  
  while (true) {
    const testGrid: GridData = JSON.parse(JSON.stringify(grid));
    
    // Clear letters that are not hints for testing
    for (let r = 0; r < testGrid.rows; r++) {
      for (let c = 0; c < testGrid.cols; c++) {
        if (!testGrid.cells[r][c].isBlack && !testGrid.cells[r][c].guess) {
          testGrid.cells[r][c].letter = undefined;
        }
      }
    }
    
    const testSolver = new Solver(testGrid, { maxSolutions: 2, enforceNumbers: true });
    const checkSols = testSolver.solve();
    
    if (checkSols.length === 1) {
      break; 
    } else {
      revealRandomHint(grid);
      hintsRevealed++;
      if (hintsRevealed >= 3) break; // Limit to max 3 hints so it's actually playable
    }
  }
  
  // Clean up 'guess' as we used it to mark hints, keep it as 'guess' so the UI knows it's a hint
  return grid;
}

function revealRandomHint(grid: GridData) {
  const candidates = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (!grid.cells[r][c].isBlack && !grid.cells[r][c].guess) {
        candidates.push(grid.cells[r][c]);
      }
    }
  }
  if (candidates.length > 0) {
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const num = pick.number;
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (!grid.cells[r][c].isBlack && grid.cells[r][c].number === num) {
           grid.cells[r][c].guess = grid.cells[r][c].letter;
        }
      }
    }
  }
}
