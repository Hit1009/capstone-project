'use client';

import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import RevealPresentation from '@/components/RevealPresentation';
import LessonSidebar from '@/components/LessonSidebar';
import TopBar from '@/components/TopBar';
import DebugControlPanel from '@/components/DebugControlPanel';
import AudioPlayer from '@/components/AudioPlayer';
import TranscriptOverlay from '@/components/TranscriptOverlay';
import DoubtPanel from '@/components/DoubtPanel';
import type { PresentationAPI, PresentationState, LessonPayload, SlideData, TopicNode, Chapter } from '@/types/presentation';
import { useAudioSync } from '@/hooks/useAudioSync';
import { fetchLesson, getAudioUrl } from '@/lib/api';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';

/** Return the full title path from a TopicNode tree to the deepest node matching the slide */
function findTopicPath(nodes: TopicNode[], slideIndex: number): string[] | null {
  for (const node of nodes) {
    if (node.children) {
      const childPath = findTopicPath(node.children, slideIndex);
      if (childPath) return [node.title, ...childPath];
    }
    if (node.slideIndices?.includes(slideIndex)) return [node.title];
  }
  return null;
}

/** Build a full breadcrumb: [chapter, ...topic ancestors, leaf topic] */
function buildBreadcrumb(chapters: Chapter[], slideIndex: number): string[] {
  for (const ch of chapters) {
    const topicPath = findTopicPath(ch.topics, slideIndex);
    if (topicPath) return [ch.title, ...topicPath];
  }
  return [];
}

// ── Inner component that renders only when lesson is loaded ─────────

function LessonView({ lesson: initialLesson }: { lesson: LessonPayload }) {
  const presentationRef = useRef<PresentationAPI>(null);

  // UI state
  const [presState, setPresState] = useState<PresentationState | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDoubtPanelOpen, setIsDoubtPanelOpen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Branch slides state
  const [lesson, setLesson] = useState<LessonPayload>(initialLesson);
  const [isBranching, setIsBranching] = useState(false);
  const [returnSlideIndex, setReturnSlideIndex] = useState<number>(0);
  const [branchSlideCount, setBranchSlideCount] = useState<number>(0);
  const [branchInsertIndex, setBranchInsertIndex] = useState<number>(0);
  const [targetSlideIndex, setTargetSlideIndex] = useState<number>(0);

  // Audio sync engine
  const { state: audioState, controls: audioControls, audioRef, audioEventHandlers } =
    useAudioSync(lesson, presentationRef);

  // ── Full breadcrumb: chapter • topic • subtopic • ... ────────────
  const breadcrumb = isBranching
    ? ['AI Tutor', 'Doubt Explanation']
    : buildBreadcrumb(lesson.coursePlan.chapters, audioState.currentSlideIndex);

  // ── Stitch markdown from all slides ──────────────────────────────
  const consolidatedMarkdown = useMemo(() => {
    return lesson.slides.map((s) => s.rawMarkdown).join('\n---\n');
  }, [lesson]);

  // ── Slide change handler ─────────────────────────────────────────
  const handleSlideChange = useCallback(
    (newState: PresentationState) => {
      setPresState(newState);
      audioControls.handleSlideChange(newState);
    },
    [audioControls]
  );

  // ── Doubt panel ──────────────────────────────────────────────────
  const openDoubtPanel = useCallback(() => {
    audioControls.pause();
    setIsDoubtPanelOpen(true);
  }, [audioControls]);

  const closeDoubtPanel = useCallback(() => {
    setIsDoubtPanelOpen(false);
    audioControls.play();
  }, [audioControls]);

  // ── Branch slides handler ────────────────────────────────────────
  const handleBranchSlides = useCallback(
    (branchSlides: SlideData[]) => {
      const currentIdx = audioState.currentSlideIndex;
      setReturnSlideIndex(currentIdx);
      setBranchSlideCount(branchSlides.length);

      // Insert branch slides after the current slide
      const insertIdx = currentIdx + 1;
      setBranchInsertIndex(insertIdx);

      // Re-index branch slides for their position in the full array
      const reindexedBranch = branchSlides.map((slide, i) => ({
        ...slide,
        slideIndex: insertIdx + i,
      }));

      // Update the lesson with injected branch slides
      setLesson((prev) => {
        const newSlides = [...prev.slides];
        newSlides.splice(insertIdx, 0, ...reindexedBranch);

        // Re-index all slides after insertion
        const finalSlides = newSlides.map((s, i) => ({ ...s, slideIndex: i }));

        return { ...prev, slides: finalSlides };
      });

      setIsBranching(true);
      setTargetSlideIndex(insertIdx);
    },
    [audioState.currentSlideIndex]
  );

  // ── Return from branch slides ────────────────────────────────────
  const handleReturnToLesson = useCallback(() => {
    // Remove branch slides from the lesson
    setLesson((prev) => {
      const newSlides = [...prev.slides];
      newSlides.splice(branchInsertIndex, branchSlideCount);
      const finalSlides = newSlides.map((s, i) => ({ ...s, slideIndex: i }));
      return { ...prev, slides: finalSlides };
    });

    setIsBranching(false);
    setBranchSlideCount(0);
    setTargetSlideIndex(returnSlideIndex);
  }, [branchInsertIndex, branchSlideCount, returnSlideIndex]);

  // ── Keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys when typing in the doubt panel textarea
      if (e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        audioControls.togglePlayPause();
      }
      if (e.key === 'Escape' && isDoubtPanelOpen) {
        closeDoubtPanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioControls, isDoubtPanelOpen, closeDoubtPanel]);

  // ── Debug handlers ───────────────────────────────────────────────
  const handleNext = () => presentationRef.current?.next();
  const handlePrev = () => presentationRef.current?.prev();
  const handleNextFragment = () => presentationRef.current?.nextFragment();
  const handlePrevFragment = () => presentationRef.current?.prevFragment();
  const handleGoToSlide = (index: number) => presentationRef.current?.goToSlide(index);
  const handleGetState = () => {
    const currentState = presentationRef.current?.getState();
    if (currentState) setPresState(currentState);
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-900 transition-colors">

      {/* Hidden audio element — driven by useAudioSync */}
      <audio
        ref={audioRef}
        src={getAudioUrl(lesson.slides[audioState.currentSlideIndex]?.audioUrl)}
        preload="auto"
        {...audioEventHandlers}
      />

      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-80 ml-0' : 'w-0 -ml-0'
        } transition-all duration-300 ease-in-out overflow-hidden shrink-0`}
      >
        <div className="w-80 h-full">
          <LessonSidebar
            onToggle={() => setIsSidebarOpen(false)}
            slides={lesson.slides}
            currentSlideIndex={audioState.currentSlideIndex}
            onGoToSlide={handleGoToSlide}
            coursePlan={lesson.coursePlan}
            currentPosition={lesson.currentPosition}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          topicTitle={isBranching ? '🤔 AI Doubt Explanation' : lesson.topicTitle}
          breadcrumb={breadcrumb}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onPauseSession={audioControls.togglePlayPause}
          onAskDoubt={openDoubtPanel}
          isPlaying={audioState.isPlaying}
        />

        {/* Branch Slide Banner */}
        {isBranching && (
          <div className="branch-banner">
            <div className="branch-banner-content">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="branch-banner-text">
                AI Tutor is explaining your doubt with interactive slides
              </span>
            </div>
            <button
              className="branch-banner-return"
              onClick={handleReturnToLesson}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Lesson</span>
            </button>
          </div>
        )}

        {/* Presentation Wrapper */}
        <main className="flex-1 relative bg-slate-50 flex flex-col overflow-hidden">
          {/* Background Effects */}
          <div className={`absolute inset-0 pointer-events-none ${
            isBranching
              ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-100/40 via-white to-white'
              : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-100/40 via-white to-white'
          }`} />

          {/* Reveal Container */}
          <div className="flex-1 flex items-center justify-center p-6 relative">
            <div className={`w-full max-w-5xl aspect-video shadow-2xl rounded-xl overflow-hidden relative z-0 ${
              isBranching
                ? 'border-2 border-indigo-400/50 shadow-indigo-200/50'
                : 'border border-slate-200'
            }`}>
              <RevealPresentation
                key={lesson.slides.length}
                initialSlide={targetSlideIndex}
                ref={presentationRef}
                markdownContent={consolidatedMarkdown}
                className="w-full h-full"
                onReady={() => {
                  console.log('Presentation ready!');
                  handleGetState();
                }}
                onSlideChange={handleSlideChange}
              />

              {/* Transcript overlay (inside the presentation viewport) */}
              <TranscriptOverlay
                transcript={audioState.currentTranscript}
                visible={showTranscript}
              />
            </div>
          </div>

          {/* Audio Player Bar */}
          <div className="relative z-10 px-6 pb-4">
            <AudioPlayer
              isPlaying={audioState.isPlaying}
              currentTime={audioState.currentTime}
              duration={audioState.duration}
              playbackRate={audioState.playbackRate}
              volume={audioState.volume}
              isMuted={audioState.isMuted}
              currentSlideIndex={audioState.currentSlideIndex}
              totalSlides={lesson.slides.length}
              showTranscript={showTranscript}
              audioError={audioState.audioError}
              onTogglePlayPause={audioControls.togglePlayPause}
              onSeek={audioControls.seekTo}
              onSetPlaybackRate={audioControls.setPlaybackRate}
              onSetVolume={audioControls.setVolume}
              onToggleMute={audioControls.toggleMute}
              onToggleTranscript={() => setShowTranscript(!showTranscript)}
              onPrevSlide={handlePrev}
              onNextSlide={handleNext}
            />
          </div>
        </main>
      </div>

      {/* Doubt Panel */}
      <DoubtPanel
        isOpen={isDoubtPanelOpen}
        onClose={closeDoubtPanel}
        courseId={lesson.lessonId}
        slideIndex={audioState.currentSlideIndex}
        slideContent={lesson.slides[audioState.currentSlideIndex]?.rawMarkdown || ''}
        transcript={lesson.slides[audioState.currentSlideIndex]?.transcript || ''}
        onBranchSlides={handleBranchSlides}
      />

      {/* Debug Controls (Overlay) */}
      <DebugControlPanel
        state={presState}
        onNext={handleNext}
        onPrev={handlePrev}
        onNextFragment={handleNextFragment}
        onPrevFragment={handlePrevFragment}
        onGoToSlide={handleGoToSlide}
        onGetState={handleGetState}
      />
    </div>
  );
}

// ── Main page with loading/error wrapper ───────────────────────────

export default function LearnPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course') ?? 'demo';

  const [lesson, setLesson] = useState<LessonPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchLesson(courseId)
      .then(setLesson)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-medium">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="bg-white border border-red-200 rounded-2xl px-10 py-8 max-w-md text-center shadow-sm">
          <p className="text-red-700 font-semibold text-lg mb-2">Failed to load lesson</p>
          <p className="text-red-500 text-sm mb-4">{error || 'Unknown error'}</p>
          <p className="text-slate-400 text-xs">Make sure the backend is running on port 5000</p>
        </div>
      </div>
    );
  }

  return <LessonView lesson={lesson} />;
}

