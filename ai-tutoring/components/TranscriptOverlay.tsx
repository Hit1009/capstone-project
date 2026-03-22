'use client';

import React from 'react';

interface TranscriptOverlayProps {
  transcript: string;
  visible: boolean;
}

export default function TranscriptOverlay({ transcript, visible }: TranscriptOverlayProps) {
  if (!visible || !transcript) return null;

  return (
    <div className="transcript-overlay">
      <p className="transcript-text">{transcript}</p>
    </div>
  );
}
