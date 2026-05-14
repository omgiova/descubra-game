import type { GridData } from '../core/types';

interface KeyboardProps {
  grid: GridData;
  selectedNum: number | null;
  onKeyPress: (char: string) => void;
  userTypedNumbers: Set<number>;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

export default function Keyboard({ grid, selectedNum, onKeyPress, userTypedNumbers }: KeyboardProps) {
  const letterToNum = new Map<string, number>();
  const lettersInPuzzle = new Set<string>();
  
  for (const row of grid.cells) {
    for (const cell of row) {
      if (!cell.isBlack) {
        if (cell.letter) lettersInPuzzle.add(cell.letter);
        if (cell.guess && cell.number) {
          letterToNum.set(cell.guess, cell.number);
        }
      }
    }
  }

  return (
    <div className="flex items-center gap-1 w-full">
      {LETTERS.map(char => {
        const isUsed = letterToNum.has(char);
        const usedByNum = letterToNum.get(char);
        const usedForSelected = isUsed && usedByNum === selectedNum;
        const wasTypedByUser = usedByNum !== undefined && userTypedNumbers.has(usedByNum);
        const notInPuzzle = !lettersInPuzzle.has(char);
        const isDisabled = !selectedNum || notInPuzzle || (isUsed && !usedForSelected);

        return (
          <button
            key={char}
            onClick={() => selectedNum && onKeyPress(char)}
            disabled={isDisabled}
            className={`
              flex-1 h-9 rounded flex items-center justify-center font-bold text-[13px] min-w-0
              transition-all duration-150
              ${wasTypedByUser ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/50' : 
                notInPuzzle ? 'bg-slate-900/60 text-slate-700 cursor-not-allowed' :
                isUsed ? 'bg-slate-700/80 text-slate-500 cursor-not-allowed' : 
                'bg-slate-600 text-white hover:bg-slate-500 active:scale-95'}
              ${isDisabled && !wasTypedByUser ? 'opacity-40' : ''}
            `}
          >
            {char}
          </button>
        );
      })}

      <button
        onClick={() => selectedNum && onKeyPress('')}
        disabled={!selectedNum}
        className={`
          flex-shrink-0 h-9 px-2 rounded flex items-center justify-center font-bold text-[10px]
          bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-150
          ${!selectedNum ? 'opacity-40 cursor-not-allowed' : ''}
        `}
        title="Apagar"
      >
        ✕
      </button>
    </div>
  );
}
