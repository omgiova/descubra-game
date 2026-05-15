import { useState, useEffect, useCallback } from 'react';
import { lexicon } from './core/lexicon';
import { generatePuzzle } from './core/generator';
import type { GridData } from './core/types';
import Grid from './components/Grid';
import Keyboard from './components/Keyboard';
import Ranking from './components/Ranking';
import { Loader2, RefreshCw, Zap, Target } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(true);
  const [grid, setGrid] = useState<GridData | null>(null);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [userTypedNumbers, setUserTypedNumbers] = useState<Set<number>>(new Set());
  const [time, setTime] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showRanking, setShowRanking] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [ranking, setRanking] = useState<{name: string, hints: number, time: number, date?: string}[]>(() => {
    const saved = localStorage.getItem('descubra_ranking');
    return saved ? JSON.parse(saved) : [];
  });

  const initGame = async () => {
    setIsWon(false);
    setSelectedNum(null);
    setUserTypedNumbers(new Set());
    setTime(0);
    setHintsUsed(0);
    setPlayerName('');
    try {
      if (lexicon.words.length === 0) {
        await lexicon.load('/10000_palavras_pt_br.txt');
      }
      
      const newGrid = await generatePuzzle();
      setGrid(newGrid);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao gerar puzzle: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    let interval: number;
    if (!loading && !isWon && !showRanking && grid) {
      interval = window.setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading, isWon, showRanking, grid]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const saveToRanking = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    const newEntry = { name: playerName || 'Anônimo', hints: hintsUsed, time, date };
    const newRanking = [...ranking, newEntry]
      .sort((a, b) => a.hints - b.hints || a.time - b.time)
      .slice(0, 10);
    setRanking(newRanking);
    localStorage.setItem('descubra_ranking', JSON.stringify(newRanking));
    setIsWon(false);
    setShowRanking(true);
  };

  useEffect(() => {
    if (!grid) return;
    
    // Check if won
    let allCorrect = true;
    let allFilled = true;
    for (const row of grid.cells) {
      for (const cell of row) {
        if (!cell.isBlack) {
          if (!cell.guess) {
            allFilled = false;
            allCorrect = false;
            break;
          }
          if (cell.guess !== cell.letter) {
            allCorrect = false;
          }
        }
      }
    }
    if (allFilled && allCorrect) {
      setIsWon(true);
      setSelectedNum(null);
    }
  }, [grid]);

  const handleCellClick = (num: number) => {
    if (!isWon) setSelectedNum(num);
  };

  // Find the next unfilled number (for Tab navigation)
  const getNextUnfilledNum = useCallback((currentNum: number | null): number | null => {
    if (!grid) return null;

    // Collect all unique numbers that are not yet guessed, in order
    const allNumbers = new Set<number>();
    const unfilledNumbers: number[] = [];
    
    for (const row of grid.cells) {
      for (const cell of row) {
        if (!cell.isBlack && cell.number !== undefined) {
          if (!allNumbers.has(cell.number)) {
            allNumbers.add(cell.number);
            if (!cell.guess) {
              unfilledNumbers.push(cell.number);
            }
          }
        }
      }
    }

    if (unfilledNumbers.length === 0) return null;

    // Sort numerically
    unfilledNumbers.sort((a, b) => a - b);

    if (currentNum === null) return unfilledNumbers[0];

    // Find the first unfilled number greater than currentNum
    const next = unfilledNumbers.find(n => n > currentNum);
    // Wrap around if at the end
    return next ?? unfilledNumbers[0];
  }, [grid]);

  const handleKeyPress = useCallback((char: string) => {
    if (!grid || !selectedNum || isWon) return;
    
    // Validate that the letter exists in the puzzle
    if (char) {
      const lettersInPuzzle = new Set<string>();
      const letterToNum = new Map<string, number>();
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
      
      // Don't accept letters not in the puzzle
      if (!lettersInPuzzle.has(char)) return;
      
    }

    // 1. UNIQUE LETTER LOGIC: If this letter is already assigned to another number, clear that number
    let updatedGrid = JSON.parse(JSON.stringify(grid));
    if (char) {
      updatedGrid.cells.forEach((row: any[]) => {
        row.forEach(cell => {
          if (!cell.isBlack && cell.guess === char && cell.number !== selectedNum) {
            const numToClear = cell.number;
            if (numToClear !== undefined) {
              // Clear this letter from all cells with this number
              updatedGrid.cells.forEach((r: any[]) => r.forEach(c => {
                if (c.number === numToClear) c.guess = undefined;
              }));
              // Remove from user typed tracking
              setUserTypedNumbers(prev => {
                const next = new Set(prev);
                next.delete(numToClear);
                return next;
              });
            }
          }
        });
      });
    }

    // 2. APPLY NEW GUESS
    const finalGrid = { ...updatedGrid };
    finalGrid.cells = updatedGrid.cells.map((row: any[]) =>
      row.map(cell => {
        if (cell.number === selectedNum) {
          return { ...cell, guess: char || undefined };
        }
        return cell;
      })
    );
    setGrid(finalGrid);

    // Track user-typed numbers
    if (char) {
      if (selectedNum) {
        setUserTypedNumbers(prev => new Set(prev).add(selectedNum));
      }
    } else if (selectedNum) {
      setUserTypedNumbers(prev => {
        const next = new Set(prev);
        next.delete(selectedNum);
        return next;
      });
    }
  }, [grid, selectedNum, isWon]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isWon || !grid) return;

      // Ignore if focus is on an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const key = e.key.toUpperCase();

      // Tab — go to next unfilled cell
      if (e.key === 'Tab') {
        e.preventDefault();
        const next = getNextUnfilledNum(selectedNum);
        if (next !== null) {
          setSelectedNum(next);
        }
        return;
      }

      // The rest require a selected cell
      if (!selectedNum) return;

      if (key === 'BACKSPACE' || key === 'DELETE') {
        e.preventDefault();
        handleKeyPress('');
        return;
      }

      if (key === 'ESCAPE') {
        e.preventDefault();
        setSelectedNum(null);
        return;
      }

      // Single letter A-Z
      if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        handleKeyPress(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress, isWon, selectedNum, grid, getNextUnfilledNum]);

  const handleGiveHint = () => {
    if (!grid || isWon || hintsUsed >= 10) return;

    const unrevealedNumbers = new Set<number>();
    for (const row of grid.cells) {
      for (const cell of row) {
        if (!cell.isBlack && cell.number !== undefined) {
          if (cell.guess !== cell.letter) {
            unrevealedNumbers.add(cell.number);
          }
        }
      }
    }

    if (unrevealedNumbers.size === 0) return;

    const numbersArray = Array.from(unrevealedNumbers);
    const pick = numbersArray[Math.floor(Math.random() * numbersArray.length)];

    // Find what the correct letter is for this number
    let revealedLetter = '';
    for (const row of grid.cells) {
      for (const cell of row) {
        if (cell.number === pick) {
          revealedLetter = cell.letter || '';
          break;
        }
      }
      if (revealedLetter) break;
    }

    const newGrid: GridData = JSON.parse(JSON.stringify(grid));
    
    // UNIQUE LETTER LOGIC for Hint: 
    // If the revealed letter was incorrectly placed elsewhere by the user, clear it.
    if (revealedLetter) {
      for (const row of newGrid.cells) {
        for (const cell of row) {
          if (!cell.isBlack && cell.guess === revealedLetter && cell.number !== pick) {
            const numToClear = cell.number;
            if (numToClear !== undefined) {
              // Clear this letter from all cells with this number
              for (const r of newGrid.cells) {
                for (const c of r) {
                  if (c.number === numToClear) c.guess = undefined;
                }
              }
              // Remove from user typed tracking
              setUserTypedNumbers(prev => {
                const next = new Set(prev);
                next.delete(numToClear);
                return next;
              });
            }
          }
        }
      }
    }

    // Now reveal the correct letter in the chosen number
    for (const row of newGrid.cells) {
      for (const cell of row) {
        if (!cell.isBlack && cell.number === pick) {
          cell.guess = cell.letter;
        }
      }
    }

    // Remove the revealed number from userTypedNumbers tracking
    setUserTypedNumbers(prev => {
      const next = new Set(prev);
      next.delete(pick);
      return next;
    });

    setGrid(newGrid);
    setHintsUsed(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-3 px-3">
      <div className="w-full max-w-5xl flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h1 className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 font-logo">
            DESCUBRA
          </h1>
          <div className="flex gap-4 mt-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-logo uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Tempo: {formatTime(time)}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-logo uppercase">
              <span className={`w-1.5 h-1.5 rounded-full ${hintsUsed >= 10 ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}></span>
              Dicas: {hintsUsed}/10
            </div>
          </div>
        </div>
        {!loading && (
          <div className="flex gap-5">
            <button 
              onClick={() => setShowRanking(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg transition-all border border-slate-700 text-[10px] font-logo uppercase"
            >
              Ranking
            </button>
            <button 
              onClick={handleGiveHint}
              disabled={hintsUsed >= 10}
              className={`flex items-center justify-center w-9 h-9 bg-slate-900 rounded-lg transition-all border border-slate-700 ring-2 ring-offset-2 ring-offset-slate-900 active:scale-95 shadow-lg ${hintsUsed >= 10 ? 'opacity-30 cursor-not-allowed border-slate-800 text-slate-600' : 'hover:bg-slate-800 text-amber-400 ring-blue-500/20 shadow-blue-500/10'}`}
              title={hintsUsed >= 10 ? "Limite de dicas atingido" : "Revelar uma letra aleatória"}
            >
              <Zap size={18} />
            </button>
            <button 
              onClick={initGame}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-lg transition-all border border-slate-700 text-xs font-logo uppercase ring-2 ring-blue-500/20 ring-offset-2 ring-offset-slate-900 active:scale-95 shadow-lg shadow-blue-500/10"
            >
              <RefreshCw size={14} />
              Novo Jogo
            </button>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-400 text-lg">Gerando um puzzle único e perfeito...</p>
          <p className="text-slate-500 text-sm mt-2">Isolando palavras maiores que 3 letras.</p>
        </div>
      ) : grid && (
        <div className="w-full max-w-5xl flex flex-col items-center gap-2 relative">
          
          {isWon && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md rounded-2xl">
              <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border border-slate-700 max-w-sm w-full mx-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                   <Target size={32} className="text-green-400" />
                </div>
                <h2 className="text-3xl font-black text-green-400 mb-2 font-logo uppercase">Vitória!</h2>
                <div className="flex flex-col gap-2 mb-6">
                   <p className="text-slate-300 text-sm">Você completou o desafio!</p>
                   <div className="flex justify-around bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500 uppercase font-logo">Tempo</span><span className="text-lg font-bold">{formatTime(time)}</span></div>
                      <div className="flex flex-col"><span className="text-[9px] text-slate-500 uppercase font-logo">Dicas</span><span className="text-lg font-bold">{hintsUsed}</span></div>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                  <input 
                    type="text" 
                    placeholder="Seu Nome" 
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-logo uppercase text-center"
                    autoFocus
                  />
                  <button 
                    onClick={saveToRanking}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all w-full font-logo uppercase shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    Salvar no Ranking
                  </button>
                  <button 
                    onClick={initGame}
                    className="text-slate-500 hover:text-slate-400 text-xs font-logo uppercase"
                  >
                    Pular e Jogar Novamente
                  </button>
                </div>
              </div>
            </div>
          )}

          {showRanking && (
            <Ranking 
              entries={ranking} 
              onClose={() => setShowRanking(false)} 
              formatTime={formatTime} 
            />
          )}

          {/* Grid + Keyboard in the same container */}
          <div className="w-full bg-slate-800 p-3 rounded-2xl shadow-xl border border-slate-700">
            <Grid 
              grid={grid} 
              selectedNum={selectedNum} 
              onCellClick={handleCellClick} 
              userTypedNumbers={userTypedNumbers}
            />
            
            <div className="border-t border-slate-700 mt-2 pt-2">
              <Keyboard 
                grid={grid} 
                selectedNum={selectedNum} 
                onKeyPress={handleKeyPress} 
                userTypedNumbers={userTypedNumbers} 
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;
