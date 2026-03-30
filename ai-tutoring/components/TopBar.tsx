import React from 'react';
import Link from 'next/link';
import { PauseCircle, PlayCircle, Menu, MessageCircle, Home } from 'lucide-react';interface TopBarProps {
  topicTitle?: string;
  /** Full hierarchy path: [chapter, topic, subtopic, ...] */
  breadcrumb?: string[];
  onToggleSidebar?: () => void;
  onPauseSession?: () => void;
  onAskDoubt?: () => void;
  isPlaying?: boolean;
}

export default function TopBar({
  topicTitle = "Neural Networks 101",
  breadcrumb = [],
  onToggleSidebar,
  onPauseSession,
  onAskDoubt,
  isPlaying = false,
}: TopBarProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
           <button onClick={onToggleSidebar} className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100">
              <Menu className="w-5 h-5" />
           </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">{topicTitle}</h1>
          {breadcrumb.length > 0 && (
            <p className="text-xs text-slate-500 hidden sm:block font-medium">
              {breadcrumb.join(' • ')}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm font-medium"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>

        <button
          onClick={onPauseSession}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors text-sm font-medium"
        >
          {isPlaying ? (
            <>
              <PauseCircle className="w-4 h-4" />
              <span>Pause Session</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" />
              <span>Resume Session</span>
            </>
          )}
        </button>

        <button
          onClick={onAskDoubt}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors text-sm font-medium cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Ask Doubt</span>
        </button>
        
        <div className="h-6 w-px bg-slate-200 mx-1"></div>

      </div>
    </header>
  );
}
