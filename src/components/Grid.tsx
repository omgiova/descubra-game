import { useRef, useEffect, useState } from 'react';
import type { GridData } from '../core/types';

interface GridProps {
  grid: GridData;
  selectedNum: number | null;
  onCellClick: (num: number) => void;
  userTypedNumbers: Set<number>;
}

export default function Grid({ grid, selectedNum, onCellClick, userTypedNumbers }: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(40);

  useEffect(() => {
    const calculateSize = () => {
      if (!containerRef.current) return;
      const container = containerRef.current.parentElement;
      if (!container) return;

      const availableWidth = container.clientWidth - 24; // 12px padding each side
      // Calculate remaining height: viewport minus everything above + keyboard below
      const containerRect = container.getBoundingClientRect();
      const availableHeight = window.innerHeight - containerRect.top - 70; // 70px for keyboard row + padding + border

      const gap = 3;
      const maxCellW = Math.floor((availableWidth - gap * (grid.cols - 1)) / grid.cols);
      const maxCellH = Math.floor((availableHeight - gap * (grid.rows - 1)) / grid.rows);

      const size = Math.max(20, Math.min(56, maxCellW, maxCellH));
      setCellSize(size);
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, [grid.rows, grid.cols]);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <div
        className="grid bg-slate-800 rounded-lg shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${grid.rows}, ${cellSize}px)`,
          gap: '3px',
          width: 'fit-content',
        }}
      >
        {grid.cells.flat().map((cell, i) => {
          if (cell.isBlack) {
            return <div key={i} className="bg-transparent" style={{ width: cellSize, height: cellSize }} />;
          }

          const isSelected = cell.number === selectedNum;
          const isUserTyped = cell.number !== undefined && userTypedNumbers.has(cell.number) && cell.guess;

          return (
            <div
              key={i}
              onClick={() => cell.number && onCellClick(cell.number)}
              style={{ width: cellSize, height: cellSize }}
              className={`
                relative cursor-pointer transition-all duration-200
                border-2 rounded-sm
                ${isSelected
                  ? 'bg-blue-200 border-blue-500 scale-110 z-10 shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/60'
                  : isUserTyped
                    ? 'bg-slate-300 border-slate-400 shadow-inner'
                    : 'bg-white hover:bg-slate-50 border-slate-300 shadow-sm hover:border-slate-400'}
              `}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
                <span
                  className="absolute top-[1px] right-[3px] text-slate-500 font-semibold leading-none"
                  style={{ fontSize: Math.max(7, cellSize * 0.22) }}
                >
                  {cell.number}
                </span>
                <span
                  className="font-bold uppercase text-slate-900 leading-none"
                  style={{ fontSize: Math.max(10, cellSize * 0.45), marginTop: cellSize * 0.12 }}
                >
                  {cell.guess || ''}
                </span>
              </div>

              {isSelected && (
                <div className="absolute inset-0 rounded-sm animate-pulse bg-blue-400/10 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
