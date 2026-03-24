'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, Loader2, BookOpen, ArrowRight, Mic, MicOff } from 'lucide-react';
import { generateCourse, type GenerateCourseResponse } from '@/lib/api';
import { useSpeechToText } from '@/hooks/useSpeechToText';

interface TopicInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseGenerated: (courseId: string) => void;
}

const PROGRESS_MESSAGES = [
  'Analyzing your topic...',
  'Designing course structure...',
  'Creating slide content...',
  'Writing narration scripts...',
  'Generating audio narration...',
  'Syncing slides with audio...',
  'Finalizing your course...',
];

export default function TopicInputModal({
  isOpen,
  onClose,
  onCourseGenerated,
}: TopicInputModalProps) {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressIndex, setProgressIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Speech-to-text
  const handleSpeechResult = useCallback((text: string) => {
    setTopic(text);
  }, []);

  const { isListening, interimText, isSupported, toggleListening, stopListening } =
    useSpeechToText({ onResult: handleSpeechResult });

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && !isGenerating) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isGenerating]);

  // Stop listening when modal closes
  useEffect(() => {
    if (!isOpen && isListening) {
      stopListening();
    }
  }, [isOpen, isListening, stopListening]);

  // Progress message rotation during generation
  useEffect(() => {
    if (!isGenerating) {
      setProgressIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setProgressIndex((prev) =>
        prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGenerating) onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isGenerating, onClose]);

  const handleSubmit = async () => {
    if (isListening) stopListening();
    const trimmed = topic.trim();
    if (!trimmed || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setProgressIndex(0);

    try {
      const result: GenerateCourseResponse = await generateCourse(trimmed);
      onCourseGenerated(result.courseId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Show interim text while speaking
  const displayValue = isListening && interimText ? interimText : topic;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="topic-modal-backdrop"
        onClick={isGenerating ? undefined : onClose}
      />

      {/* Modal */}
      <div className="topic-modal">
        {/* Close button */}
        {!isGenerating && (
          <button className="topic-modal-close" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        )}

        {isGenerating ? (
          /* Generation Loading State */
          <div className="topic-modal-generating">
            <div className="topic-modal-spinner-ring">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
            <h3 className="topic-modal-gen-title">Creating Your Course</h3>
            <p className="topic-modal-gen-topic">&ldquo;{topic}&rdquo;</p>
            <div className="topic-modal-progress">
              <div className="topic-modal-progress-bar">
                <div
                  className="topic-modal-progress-fill"
                  style={{
                    width: `${((progressIndex + 1) / PROGRESS_MESSAGES.length) * 100}%`,
                  }}
                />
              </div>
              <p className="topic-modal-progress-text">
                {PROGRESS_MESSAGES[progressIndex]}
              </p>
            </div>
            <p className="topic-modal-gen-hint">
              This may take 30–60 seconds
            </p>
          </div>
        ) : (
          /* Input State */
          <>
            <div className="topic-modal-header">
              <div className="topic-modal-icon">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h2 className="topic-modal-title">Learn Anything</h2>
              <p className="topic-modal-subtitle">
                Enter any topic or use your voice — our AI will generate a complete
                interactive course with slides, narration, and audio.
              </p>
            </div>

            <div className="topic-modal-input-area">
              <div className="topic-modal-input-wrapper">
                <BookOpen className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  className="topic-modal-input"
                  placeholder={isListening ? 'Listening... say a topic' : 'e.g. "Introduction to Machine Learning"'}
                  value={displayValue}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {isSupported && (
                  <button
                    className={`stt-mic-btn ${isListening ? 'stt-mic-btn-active' : ''}`}
                    onClick={toggleListening}
                    disabled={isGenerating}
                    title={isListening ? 'Stop recording' : 'Voice input'}
                    type="button"
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              <button
                className="topic-modal-submit"
                onClick={handleSubmit}
                disabled={!displayValue.trim()}
              >
                <span>Generate Course</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="topic-modal-error">
                <p>{error}</p>
              </div>
            )}

            <div className="topic-modal-suggestions">
              <p className="topic-modal-suggestions-label">Try these:</p>
              <div className="topic-modal-suggestion-chips">
                {[
                  'Blockchain Basics',
                  'Quantum Computing 101',
                  'Introduction to Psychology',
                  'Machine Learning Fundamentals',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="topic-modal-chip"
                    onClick={() => setTopic(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
