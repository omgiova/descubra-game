import { generatePuzzle } from './src/core/generator';
import { lexicon } from './src/core/lexicon';
import fs from 'fs';

async function test() {
  const text = fs.readFileSync('../10000_palavras_pt_br.txt', 'utf8');
  lexicon.process(text);
  console.log('Words loaded:', lexicon.words.length);
  try {
    const start = Date.now();
    await generatePuzzle();
    console.log('Success! Took', Date.now() - start, 'ms');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
