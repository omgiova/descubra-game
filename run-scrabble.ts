import { generateScrabbleLayout } from './test-scrabble';
import { lexicon } from './src/core/lexicon';
import fs from 'fs';

const text = fs.readFileSync('../10000_palavras_pt_br.txt', 'utf8');
lexicon.process(text);
const res = generateScrabbleLayout(Array.from(lexicon.words));
if (res) {
  console.log(res.layout.map((r, i) => r.map((c, j) => c ? res.filled[i][j] : ' ').join(' ')).join('\n'));
} else {
  console.log('Failed');
}
