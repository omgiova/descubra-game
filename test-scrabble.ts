export function generateScrabbleLayout(words: string[], targetWords = 15, gridSize = 20): { layout: number[][], filled: string[][] } | null {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(' '));
  
  const placed: { word: string, r: number, c: number, dir: 'H'|'V' }[] = [];
  
  const canPlace = (word: string, r: number, c: number, dir: 'H'|'V'): boolean => {
    if (dir === 'H') {
      if (c < 0 || c + word.length > gridSize || r < 0 || r >= gridSize) return false;
      // Check before and after
      if (c - 1 >= 0 && grid[r][c - 1] !== ' ') return false;
      if (c + word.length < gridSize && grid[r][c + word.length] !== ' ') return false;
      
      for (let i = 0; i < word.length; i++) {
        const char = grid[r][c + i];
        if (char !== ' ' && char !== word[i]) return false;
        
        // If it's an empty cell, check top and bottom so we don't form accidental vertical words
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

  // Place first word in center
  const firstWord = words[Math.floor(Math.random() * words.length)];
  const startR = Math.floor(gridSize / 2);
  const startC = Math.floor((gridSize - firstWord.length) / 2);
  place(firstWord, startR, startC, 'H');

  let attempts = 0;
  while (placed.length < targetWords && attempts < 1000) {
    attempts++;
    const base = placed[Math.floor(Math.random() * placed.length)];
    const letterIdx = Math.floor(Math.random() * base.word.length);
    const letter = base.word[letterIdx];
    const intersectR = base.dir === 'H' ? base.r : base.r + letterIdx;
    const intersectC = base.dir === 'H' ? base.c + letterIdx : base.c;
    
    // Find a random word containing this letter
    // For performance, we should ideally have a map of letter -> words, but we can just loop randomly
    let newWord = '';
    let newLetterIdx = -1;
    for (let i = 0; i < 50; i++) {
      const w = words[Math.floor(Math.random() * words.length)];
      if (w === base.word) continue;
      const idx = w.indexOf(letter);
      if (idx !== -1) {
        newWord = w;
        newLetterIdx = idx;
        break;
      }
    }
    if (!newWord) continue;

    const newDir = base.dir === 'H' ? 'V' : 'H';
    const newR = newDir === 'H' ? intersectR : intersectR - newLetterIdx;
    const newC = newDir === 'H' ? intersectC - newLetterIdx : intersectC;

    if (canPlace(newWord, newR, newC, newDir)) {
      place(newWord, newR, newC, newDir);
      attempts = 0; // reset
    }
  }

  if (placed.length < 5) return null; // failed to make a good puzzle

  // Crop to bounding box
  let minR = gridSize, maxR = 0, minC = gridSize, maxC = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c] !== ' ') {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }

  // Add 1 cell padding
  minR = Math.max(0, minR - 1);
  maxR = Math.min(gridSize - 1, maxR + 1);
  minC = Math.max(0, minC - 1);
  maxC = Math.min(gridSize - 1, maxC + 1);

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
