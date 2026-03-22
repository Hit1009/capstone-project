'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, Trash2, User, Bot } from 'lucide-react';
import { askDoubt, type DoubtMessage } from '@/lib/api';

interface DoubtPanelProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  slideIndex: number;
  slideContent: string;
  transcript: string;
}

export default function DoubtPanel({
  isOpen,
  onClose,
  courseId,
  slideIndex,
  slideContent,
  transcript,
}: DoubtPanelProps) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<DoubtMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const userMessage: DoubtMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);
    setError(null);

    try {
      const { answer } = await askDoubt({
        question: trimmed,
        courseId,
        slideIndex,
        slideContent,
        transcript,
        history: messages,
      });
      setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
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

  const handleClear = () => {
    setMessages([]);
    setError(null);
    setQuestion('');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="doubt-panel-backdrop"
          onClick={onClose}
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
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="doubt-panel-close"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="doubt-panel-close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="doubt-panel-body custom-scrollbar">
          {messages.length === 0 && !isLoading ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-5 shadow-sm">
                <Sparkles className="w-8 h-8 text-indigo-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">
                Ask anything about this slide
              </h4>
              <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
                The AI tutor has context about what you&apos;re currently learning
                and will provide personalized explanations.
              </p>
            </div>
          ) : (
            /* Conversation */
            <div className="doubt-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`doubt-message doubt-message-${msg.role}`}>
                  <div className={`doubt-message-avatar doubt-message-avatar-${msg.role}`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`doubt-message-bubble doubt-message-bubble-${msg.role}`}>
                    <p className="doubt-message-text">{msg.text}</p>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="doubt-message doubt-message-ai">
                  <div className="doubt-message-avatar doubt-message-avatar-ai">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="doubt-loading">
                    <div className="doubt-loading-dot" />
                    <div className="doubt-loading-dot" />
                    <div className="doubt-loading-dot" />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="doubt-error">
                  <p>{error}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
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
