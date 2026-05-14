export function generatePattern(sequence: (string | number)[]): string {
  const map = new Map<string | number, string>();
  let nextChar = 65; // 'A'
  let pattern = '';
  for (const item of sequence) {
    if (!map.has(item)) {
      map.set(item, String.fromCharCode(nextChar++));
    }
    pattern += map.get(item);
  }
  return pattern;
}

export class Lexicon {
  public words: string[] = [];
  public byLength: Record<number, string[]> = {};
  public bySignature: Record<string, string[]> = {};

  async load(url: string) {
    const response = await fetch(url);
    const text = await response.text();
    this.process(text);
  }

  process(text: string) {
    const rawWords = text.split('\n').map(w => w.trim()).filter(w => w.length > 0);
    
    const validWords = new Set<string>();
    
    for (let word of rawWords) {
      word = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      word = word.toUpperCase();
      
      // Allow only A-Z
      if (!/^[A-Z]+$/.test(word)) continue;
      
      // Minimum length 4 for crossword
      if (word.length < 4) continue;
      
      validWords.add(word);
    }

    this.words = Array.from(validWords);
    
    for (const word of this.words) {
      const len = word.length;
      if (!this.byLength[len]) this.byLength[len] = [];
      this.byLength[len].push(word);
      
      const sig = generatePattern(word.split(''));
      if (!this.bySignature[sig]) this.bySignature[sig] = [];
      this.bySignature[sig].push(word);
    }
  }

  getWordsByLength(len: number): string[] {
    return this.byLength[len] || [];
  }

  getWordsBySignature(sig: string): string[] {
    return this.bySignature[sig] || [];
  }
}

export const lexicon = new Lexicon();
