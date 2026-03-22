'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { LessonPayload, PresentationAPI, PresentationState } from '@/types/presentation';

export interface AudioSyncState {
  /** Index of the currently active slide */
  currentSlideIndex: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Duration of current slide's audio */
  duration: number;
  /** Set of mark names already triggered on the current slide */
  triggeredMarks: Set<string>;
  /** Current transcript text */
  currentTranscript: string;
  /** Playback speed multiplier */
  playbackRate: number;
  /** Volume (0-1) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Whether the audio file failed to load (enables fallback mode) */
  audioError: boolean;
}

export interface AudioSyncControls {
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  seekTo: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  /** Called by RevealPresentation onSlideChange */
  handleSlideChange: (state: PresentationState) => void;
}

/**
 * Custom hook that manages audio–visual synchronization between an <audio>
 * element and Reveal.js fragments. Watches audio.currentTime and triggers
 * presentationRef.nextFragment() at the timepoints defined in the lesson payload.
 */
export function useAudioSync(
  lesson: LessonPayload,
  presentationRef: React.RefObject<PresentationAPI | null>
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const triggeredMarksRef = useRef<Set<string>>(new Set());
  const currentSlideIndexRef = useRef(0);
  const [state, setState] = useState<AudioSyncState>({
    currentSlideIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    triggeredMarks: new Set(),
    currentTranscript: lesson.slides[0]?.transcript ?? '',
    playbackRate: 1,
    volume: 1,
    isMuted: false,
    audioError: false,
  });

  // ── Playback Controls ──────────────────────────────────────────────

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {
      // Autoplay blocked — user needs to interact first
    });
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayPause = useCallback(() => {
    if (audioRef.current?.paused) {
      play();
    } else {
      pause();
    }
  }, [play, pause]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      // Reset triggered marks — we might need to re-trigger some
      triggeredMarksRef.current.clear();
      setState(prev => ({
        ...prev,
        currentTime: time,
        triggeredMarks: new Set(),
      }));
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    setState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
    }
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  // ── Core Synchronization ───────────────────────────────────────────

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;

    const currentTime = audioRef.current.currentTime;
    const slideIdx = currentSlideIndexRef.current;
    const currentSlide = lesson.slides[slideIdx];
    if (!currentSlide) return;

    // Check for timepoints that need triggering
    let triggered = false;
    currentSlide.timepoints.forEach((mark) => {
      if (
        currentTime >= mark.timeSeconds &&
        !triggeredMarksRef.current.has(mark.markName)
      ) {
        triggeredMarksRef.current.add(mark.markName);
        triggered = true;
        console.log(`[AudioSync] Triggering ${mark.markName} at ${currentTime.toFixed(2)}s`);
        presentationRef.current?.nextFragment();
      }
    });

    setState(prev => ({
      ...prev,
      currentTime,
      ...(triggered ? { triggeredMarks: new Set(triggeredMarksRef.current) } : {}),
    }));
  }, [lesson.slides, presentationRef]);

  const handleEnded = useCallback(() => {
    const isLast = currentSlideIndexRef.current >= lesson.slides.length - 1;
    if (!isLast) {
      // Auto-advance to the next slide
      presentationRef.current?.next();
    } else {
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [lesson.slides.length, presentationRef]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setState(prev => ({
        ...prev,
        duration: audioRef.current!.duration || lesson.slides[prev.currentSlideIndex]?.audioDuration || 0,
        audioError: false,
      }));
    }
  }, [lesson.slides]);

  const handleAudioError = useCallback(() => {
    // Audio file failed to load — enable fallback mode
    const currentSlide = lesson.slides[currentSlideIndexRef.current];
    setState(prev => ({
      ...prev,
      audioError: true,
      duration: currentSlide?.audioDuration || 0,
    }));
  }, [lesson.slides]);

  // ── Slide Change Handler ───────────────────────────────────────────

  const handleSlideChange = useCallback((newState: PresentationState) => {
    const newIndex = newState.slideIndex;
    // Use ref to always compare against the LATEST slide index (not a stale closure)
    if (newIndex === currentSlideIndexRef.current) return;

    // Reset triggers for the new slide
    currentSlideIndexRef.current = newIndex;
    triggeredMarksRef.current.clear();

    setState(prev => ({
      ...prev,
      currentSlideIndex: newIndex,
      currentTime: 0,
      triggeredMarks: new Set(),
      currentTranscript: lesson.slides[newIndex]?.transcript ?? '',
      audioError: false,
    }));
  }, [lesson.slides]);

  // ── Auto-play when slide changes ───────────────────────────────────

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [state.currentSlideIndex]);

  // ── Auto-play on initial mount ────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      play();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const controls: AudioSyncControls = {
    play,
    pause,
    togglePlayPause,
    seekTo,
    setPlaybackRate,
    setVolume,
    toggleMute,
    handleSlideChange,
  };

  return {
    state,
    controls,
    audioRef,
    // Event handlers to attach to the <audio> element
    audioEventHandlers: {
      onTimeUpdate: handleTimeUpdate,
      onEnded: handleEnded,
      onLoadedMetadata: handleLoadedMetadata,
      onError: handleAudioError,
      onPlay: () => setState(prev => ({ ...prev, isPlaying: true })),
      onPause: () => setState(prev => ({ ...prev, isPlaying: false })),
    },
  };
}
