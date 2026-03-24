'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { askDoubtSlides } from '@/lib/api';
import type { SlideData } from '@/types/presentation';

interface DoubtPanelProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  slideIndex: number;
  slideContent: string;
  transcript: string;
  onBranchSlides: (slides: SlideData[]) => void;
}

export default function DoubtPanel({
  isOpen,
  onClose,
  courseId,
  slideIndex,
  slideContent,
  transcript,
  onBranchSlides,
}: DoubtPanelProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { slides } = await askDoubtSlides({
        question: trimmed,
        courseId,
        slideIndex,
        slideContent,
        transcript,
      });

      // Pass branch slides to the parent
      setQuestion('');
      onBranchSlides(slides);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="doubt-panel-backdrop"
          onClick={isLoading ? undefined : onClose}
        />
      )}

      {/* Panel */}
      <div className={`doubt-panel ${isOpen ? 'doubt-panel-open' : ''}`}>
        {/* Header */}
        <div className="doubt-panel-header">
          <div>
            <h3 className="doubt-panel-title">Ask a Doubt</h3>
            <p className="doubt-panel-subtitle">
              AI tutor · Slide {slideIndex + 1}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!isLoading && (
              <button
                onClick={onClose}
                className="doubt-panel-close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="doubt-panel-body custom-scrollbar">
          {isLoading ? (
            /* Generation Loading State */
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-5 shadow-sm">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">
                Preparing your explanation
              </h4>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-4">
                The AI tutor is creating interactive slides to answer your question...
              </p>
              <div className="doubt-gen-progress">
                <div className="doubt-gen-progress-bar" />
              </div>
              <p className="text-xs text-slate-400 mt-4">This may take 10–15 seconds</p>
            </div>
          ) : (
            /* Empty state / Input prompt */
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-5 shadow-sm">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">
                Ask anything about this slide
              </h4>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                The AI tutor will create a set of interactive slides with audio
                narration to explain your doubt visually.
              </p>
              <div className="flex items-center gap-2 mt-5 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium text-indigo-600">
                  Response: Interactive slides + audio
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="doubt-error mx-4 mb-4">
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="doubt-panel-input-area">
          <div className="doubt-panel-input-wrapper">
            <textarea
              ref={textareaRef}
              className="doubt-panel-textarea"
              placeholder="Ask a question about the current slide..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={isLoading}
            />
            <button
              className="doubt-panel-submit"
              onClick={handleSubmit}
              disabled={!question.trim() || isLoading}
              title="Send question"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Ask AI</span>
            </button>
          </div>
          <p className="doubt-panel-input-hint">
            Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line · <kbd>Esc</kbd> to close
          </p>
        </div>
      </div>
    </>
  );
}

