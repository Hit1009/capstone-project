'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/white.css';
import type { PresentationAPI, PresentationState } from '@/types/presentation';

interface RevealPresentationProps {
  /**
   * Markdown content for the slides.
   * Use --- to separate slides.
   */
  markdownContent: string;
  /**
   * Optional CSS class for the container
   */
  className?: string;
  /**
   * Callback when presentation is ready
   */
  onReady?: () => void;
  /**
   * Callback when slide changes
   */
  onSlideChange?: (state: PresentationState) => void;
  /**
   * Initial slide index
   */
  initialSlide?: number;
}

const RevealPresentation = forwardRef<PresentationAPI, RevealPresentationProps>(
  ({ markdownContent, className = '', onReady, onSlideChange, initialSlide = 0 }, ref) => {
    const deckDivRef = useRef<HTMLDivElement>(null);
    const deckRef = useRef<Reveal.Api | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Keep a ref to the latest callbacks so event listeners never go stale
    const onSlideChangeRef = useRef(onSlideChange);
    const onReadyRef = useRef(onReady);
    onSlideChangeRef.current = onSlideChange;
    onReadyRef.current = onReady;

    // Helper to get current state
    const getState = (): PresentationState | null => {
      if (!deckRef.current) return null;
      const indices = deckRef.current.getIndices();
      const totalSlides = deckRef.current.getTotalSlides();
      return {
        slideIndex: indices.h,
        fragmentIndex: indices.f ?? -1,
        progress: deckRef.current.getProgress(),
        isFirst: indices.h === 0 && (indices.f ?? 0) <= 0,
        isLast: deckRef.current.isLastSlide(),
        totalSlides,
      };
    };

    // Expose API via ref
    useImperativeHandle(ref, () => ({
      // Navigation
      next: () => {
        deckRef.current?.next();
      },
      prev: () => {
        deckRef.current?.prev();
      },
      goToSlide: (index: number) => {
        deckRef.current?.slide(index, 0);
      },

      // Fragments
      nextFragment: () => {
        return deckRef.current?.nextFragment() ?? false;
      },
      prevFragment: () => {
        return deckRef.current?.prevFragment() ?? false;
      },

      // State
      getState,
      getTotalSlides: () => {
        return deckRef.current?.getTotalSlides() ?? 0;
      },
      isFirstSlide: () => {
        return deckRef.current?.isFirstSlide() ?? true;
      },
      isLastSlide: () => {
        return deckRef.current?.isLastSlide() ?? false;
      },
    }));

    useEffect(() => {
      // Prevent double initialization in React StrictMode
      if (deckRef.current) {
        return;
      }

      if (!deckDivRef.current) {
        return;
      }

      // Initialize Reveal.js
      const deck = new Reveal(deckDivRef.current, {
        plugins: [Markdown],
        embedded: true,
        hash: false,
        history: false,
        controls: false,
        keyboard: false,
        progress: true,
        center: true,
        transition: 'slide',
        // Markdown plugin configuration
        markdown: {
          smartypants: true,
        },
      });

      deck.initialize().then(() => {
        deckRef.current = deck;
        setIsReady(true);
        
        if (initialSlide > 0) {
          deck.slide(initialSlide, 0);
        }
        
        onReadyRef.current?.();

        // Notify via ref so listeners always call the LATEST callback
        const notifyChange = () => {
          const state = getState();
          if (state) onSlideChangeRef.current?.(state);
        };

        deck.on('slidechanged', notifyChange);
        deck.on('fragmentshown', notifyChange);
        deck.on('fragmenthidden', notifyChange);
      });

      // Cleanup on unmount
      return () => {
        if (deckRef.current) {
          try {
            deckRef.current.destroy();
            deckRef.current = null;
          } catch (e) {
            console.warn('Error destroying Reveal instance:', e);
          }
        }
      };
    }, []);

    return (
      <div className={`reveal-container ${className}`}>
        <div className="reveal" ref={deckDivRef}>
          <div className="slides">
            <section
              data-markdown=""
              data-separator="^---$"
              data-separator-notes="^Note:"
            >
              <textarea data-template defaultValue={markdownContent} />
            </section>
          </div>
        </div>
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-lg">Loading presentation...</div>
          </div>
        )}
      </div>
    );
  }
);

RevealPresentation.displayName = 'RevealPresentation';

export default RevealPresentation;
