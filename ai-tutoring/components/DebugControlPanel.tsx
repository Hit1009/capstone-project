'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PresentationState } from '@/types/presentation';
import { ChevronDown, ChevronUp, GripVertical, Terminal } from 'lucide-react';

interface DebugControlPanelProps {
  state: PresentationState | null;
  onNext: () => void;
  onPrev: () => void;
  onNextFragment: () => void;
  onPrevFragment: () => void;
  onGoToSlide: (index: number) => void;
  onGetState: () => void;
}

export default function DebugControlPanel({
  state,
  onNext,
  onPrev,
  onNextFragment,
  onPrevFragment,
  onGoToSlide,
  onGetState,
}: DebugControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ── Drag state ─────────────────────────────────────────────────────
  const [position, setPosition] = useState({ x: 16, y: 16 }); // top-right default
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Compute initial position (top-right) on mount
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized && typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 340, y: 16 });
      setInitialized(true);
    }
  }, [initialized]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from header area
    e.preventDefault();
    setIsDragging(true);
    dragOrigin.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragOrigin.current.mouseX;
      const dy = e.clientY - dragOrigin.current.mouseY;
      setPosition({
        x: Math.max(0, dragOrigin.current.startX + dx),
        y: Math.max(0, dragOrigin.current.startY + dy),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className={`fixed bg-white border border-slate-200 rounded-lg shadow-2xl transition-shadow duration-300 z-50 flex flex-col ${isExpanded ? 'w-80 h-auto' : 'w-auto h-auto'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      
      {/* Header / Toggle — also the drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center gap-2 px-4 py-3 w-full hover:bg-slate-50 transition-colors rounded-t-lg border-b border-transparent hover:border-slate-100 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <div className={`w-2 h-2 rounded-full ${state ? 'bg-emerald-500 shadow-sm' : 'bg-red-500'}`} />
        <span className="text-slate-700 font-mono text-xs font-bold uppercase tracking-wider flex-1 text-left">
           Debug Controls
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="p-0.5 hover:bg-slate-200 rounded transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-4 space-y-4 border-t border-slate-100">
             {/* State Display */}
             <div className="bg-slate-50 rounded p-2 text-[10px] font-mono border border-slate-200 text-slate-600">
                {state ? (
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>Slide:</span> <span className="text-blue-600 font-bold">{state.slideIndex} / {state.totalSlides - 1}</span></div>
                    <div className="flex justify-between"><span>Fragment:</span> <span className="text-indigo-600 font-bold">{state.fragmentIndex}</span></div>
                    <div className="flex justify-between"><span>Progress:</span> <span className="text-emerald-600 font-bold">{(state.progress * 100).toFixed(0)}%</span></div>
                  </div>
                ) : (
                  <div className="text-amber-500 font-bold">Waiting for presentation...</div>
                )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-2">
                 <button onClick={onPrev} className="debug-btn">Prev Slide</button>
                 <button onClick={onNext} className="debug-btn">Next Slide</button>
                 <button onClick={onPrevFragment} className="debug-btn">Prev Frag</button>
                 <button onClick={onNextFragment} className="debug-btn">Next Frag</button>
            </div>
            
            <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Jump to Slide</label>
                <div className="flex flex-wrap gap-1">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                    <button
                        key={i}
                        onClick={() => onGoToSlide(i)}
                        className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold transition-colors ${
                        state?.slideIndex === i
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                        }`}
                    >
                        {i}
                    </button>
                    ))}
                </div>
            </div>

             <button onClick={onGetState} className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 transition-colors flex items-center justify-center gap-2">
                 <Terminal className="w-3 h-3" /> Refresh State
             </button>
        </div>
      )}
      
      <style jsx>{`
        .debug-btn {
            @apply px-2 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs rounded border border-slate-200 transition-colors shadow-sm active:bg-slate-100;
        }
      `}</style>
    </div>
  );
}
