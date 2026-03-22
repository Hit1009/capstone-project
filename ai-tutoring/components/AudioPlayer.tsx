'use client';

import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Captions,
  CaptionsOff,
  SkipBack,
  SkipForward,
} from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  currentSlideIndex: number;
  totalSlides: number;
  showTranscript: boolean;
  audioError: boolean;
  onTogglePlayPause: () => void;
  onSeek: (time: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onSetVolume: (volume: number) => void;
  onToggleMute: () => void;
  onToggleTranscript: () => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

export default function AudioPlayer({
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  volume,
  isMuted,
  currentSlideIndex,
  totalSlides,
  showTranscript,
  audioError,
  onTogglePlayPause,
  onSeek,
  onSetPlaybackRate,
  onSetVolume,
  onToggleMute,
  onToggleTranscript,
  onPrevSlide,
  onNextSlide,
}: AudioPlayerProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  };

  const cyclePlaybackRate = () => {
    const currentIdx = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIdx = (currentIdx + 1) % PLAYBACK_RATES.length;
    onSetPlaybackRate(PLAYBACK_RATES[nextIdx]);
  };

  return (
    <div className="audio-player">
      {/* Progress bar */}
      <div
        className="audio-player-progress-track"
        onClick={handleProgressClick}
      >
        <div
          className="audio-player-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="audio-player-controls">
        {/* Left: slide navigation + play/pause */}
        <div className="audio-player-left">
          <button
            onClick={onPrevSlide}
            className="audio-player-btn"
            title="Previous slide"
            disabled={currentSlideIndex <= 0}
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlayPause}
            className="audio-player-btn audio-player-btn-primary"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <button
            onClick={onNextSlide}
            className="audio-player-btn"
            title="Next slide"
            disabled={currentSlideIndex >= totalSlides - 1}
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <span className="audio-player-time">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {audioError && (
            <span className="audio-player-error" title="Audio file not found — using timer mode">
              ⚠ No audio
            </span>
          )}
        </div>

        {/* Center: slide indicator */}
        <div className="audio-player-center">
          <span className="audio-player-slide-indicator">
            Slide {currentSlideIndex + 1} / {totalSlides}
          </span>
        </div>

        {/* Right: speed, volume, transcript */}
        <div className="audio-player-right">
          <button
            onClick={cyclePlaybackRate}
            className="audio-player-btn audio-player-speed"
            title={`Playback speed: ${playbackRate}×`}
          >
            {playbackRate}×
          </button>

          <button
            onClick={onToggleMute}
            className="audio-player-btn"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onSetVolume(parseFloat(e.target.value))}
            className="audio-player-volume-slider"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />

          <div className="audio-player-divider" />

          <button
            onClick={onToggleTranscript}
            className={`audio-player-btn ${showTranscript ? 'audio-player-btn-active' : ''}`}
            title={showTranscript ? 'Hide captions' : 'Show captions'}
          >
            {showTranscript ? (
              <Captions className="w-4 h-4" />
            ) : (
              <CaptionsOff className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
