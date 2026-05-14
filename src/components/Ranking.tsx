import React from 'react';
import { Zap, Trophy, Timer, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface RankEntry {
  name: string;
  hints: number;
  time: number;
  date?: string;
}

interface RankingProps {
  entries: RankEntry[];
  onClose: () => void;
  formatTime: (s: number) => string;
}

export default function Ranking({ entries, onClose, formatTime }: RankingProps) {
  const [selectedHintCategory, setSelectedHintCategory] = React.useState(0);

  const filteredEntries = entries
    .filter(e => e.hints === selectedHintCategory)
    .sort((a, b) => a.time - b.time) // Within the same hint category, time is the differentiator
    .slice(0, 10);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-2 sm:p-8">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Trophy size={24} />
              </div>
              <h2 className="text-xl font-logo text-white uppercase tracking-tighter">Rankings por Categoria</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Category Navigation */}
          <div className="flex items-center justify-center gap-6 mt-2 bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setSelectedHintCategory(prev => (prev === 0 ? 10 : prev - 1))}
              className="p-2 rounded-lg transition-colors text-blue-500 hover:bg-blue-500/10"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="flex flex-col items-center min-w-[150px]">
              <span className="text-[10px] text-slate-500 font-logo uppercase tracking-widest mb-1">Categoria</span>
              <span className="text-lg font-logo text-white uppercase tracking-tighter">
                {selectedHintCategory === 0 ? 'Sem Dicas' : 
                 selectedHintCategory === 1 ? '1 Dica' : 
                 `${selectedHintCategory} Dicas`}
              </span>
            </div>

            <button 
              onClick={() => setSelectedHintCategory(prev => (prev === 10 ? 0 : prev + 1))}
              className="p-2 rounded-lg transition-colors text-blue-500 hover:bg-blue-500/10"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 text-center">
            <span className="text-[10px] font-logo text-slate-500 uppercase tracking-[0.2em]">
              Melhores tempos com {selectedHintCategory} {selectedHintCategory === 1 ? 'dica' : 'dicas'}
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <Zap size={48} className="opacity-20 mb-4" />
              <p className="font-logo uppercase text-[10px] tracking-widest text-center">Nenhum recorde nesta categoria.<br/>Seja o primeiro a dominar!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry, i) => (
                <div 
                  key={i}
                  className={`
                    flex items-center justify-between p-3 rounded-xl border transition-all
                    ${i === 0 ? 'bg-amber-500/10 border-amber-500/30' : 
                      'bg-slate-800/30 border-slate-700/50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center font-logo text-[10px] font-black
                      ${i === 0 ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-400'}
                    `}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-logo uppercase text-xs text-white">
                        {entry.name}
                      </div>
                      <div className="text-[9px] text-slate-600">
                        {entry.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Timer size={10} />
                        <span className="font-mono font-medium text-sm">{formatTime(entry.time)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/50">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-logo uppercase tracking-widest rounded-2xl transition-all"
          >
            Fechar Rankings
          </button>
        </div>
      </div>
    </div>
  );
}
