import { generateScrabbleLayout } from './test-scrabble';
import { lexicon } from './src/core/lexicon';
import fs from 'fs';

const text = fs.readFileSync('../10000_palavras_pt_br.txt', 'utf8');
lexicon.process(text);

for (let i = 0; i < 100; i++) {
  const res = generateScrabbleLayout(Array.from(lexicon.words), 15, 20);
  if (!res) continue;
  
  const layout = res.layout;
  const sizeR = layout.length;
  const sizeC = layout[0].length;
  
  for (let r = 0; r < sizeR; r++) {
    let len = 0;
    for (let c = 0; c <= sizeC; c++) {
      if (c < sizeC && layout[r][c] === 1) len++;
      else {
        if (len > 0 && len < 4) {
          console.log(`Row ${r} has invalid length ${len}: \n${layout[r].join(' ')}`);
          process.exit(1);
        }
        len = 0;
      }
    }
  }
  for (let c = 0; c < sizeC; c++) {
    let len = 0;
    for (let r = 0; r <= sizeR; r++) {
      if (r < sizeR && layout[r][c] === 1) len++;
      else {
        if (len > 0 && len < 4) {
          console.log(`Col ${c} has invalid length ${len}`);
          process.exit(1);
        }
        len = 0;
      }
    }
  }
}
console.log("All good!");
