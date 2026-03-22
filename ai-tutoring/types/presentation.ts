/**
 * Types for the Presentation API exposed by RevealPresentation component.
 * These APIs allow programmatic control of the presentation for LLM integration.
 */

export interface PresentationState {
  /** Current slide index (0-based, linear) */
  slideIndex: number;
  /** Current fragment index within the slide (-1 if no fragments shown) */
  fragmentIndex: number;
  /** Progress through the presentation (0 to 1) */
  progress: number;
  /** Whether this is the first slide */
  isFirst: boolean;
  /** Whether this is the last slide */
  isLast: boolean;
  /** Total number of slides */
  totalSlides: number;
}

export interface PresentationAPI {
  // Navigation
  /** Move to next slide or fragment */
  next: () => void;
  /** Move to previous slide or fragment */
  prev: () => void;
  /** Jump to a specific slide by index (0-based) */
  goToSlide: (index: number) => void;

  // Fragments
  /** Show next fragment (stays on current slide) */
  nextFragment: () => boolean;
  /** Hide current fragment (stays on current slide) */
  prevFragment: () => boolean;

  // State
  /** Get current presentation state */
  getState: () => PresentationState | null;
  /** Get total number of slides */
  getTotalSlides: () => number;
  /** Check if on first slide */
  isFirstSlide: () => boolean;
  /** Check if on last slide */
  isLastSlide: () => boolean;
}

// --- Audio-Synced Lesson Payload Types ---

/** A single SSML <mark> timepoint returned by Google TTS */
export interface TTSMark {
  /** Mark identifier, e.g. "frag-1" */
  markName: string;
  /** Time in seconds when this mark occurs in the audio */
  timeSeconds: number;
  /** Parsed fragment index (maps to Reveal.js fragment order) */
  fragmentIndex: number;
}

/** A single synchronized slide within a lesson */
export interface SlideData {
  /** Unique slide identifier */
  id: string;
  /** 0-based index of the slide in the lesson */
  slideIndex: number;
  /** Pure Reveal.js markdown for this slide (with fragment annotations) */
  rawMarkdown: string;
  /** URL to the TTS audio file for this slide */
  audioUrl: string;
  /** Total duration of the audio in seconds */
  audioDuration: number;
  /** Array of timestamps to trigger fragments */
  timepoints: TTSMark[];
  /** Plain text transcript for closed captions */
  transcript: string;
}

// --- Course Plan Types ---

/** A recursive topic node — children can nest to arbitrary depth */
export interface TopicNode {
  id: string;
  title: string;
  children?: TopicNode[];
  /** 0-based indices of slides this topic spans (can be multiple) */
  slideIndices?: number[];
}

/** A chapter containing a tree of topics */
export interface Chapter {
  id: string;
  title: string;
  topics: TopicNode[];
}

/** The full course plan */
export interface CoursePlan {
  courseTitle: string;
  chapters: Chapter[];
}

/** Complete lesson payload — matches future Express API response */
export interface LessonPayload {
  /** Unique lesson identifier */
  lessonId: string;
  /** Display title for the lesson topic */
  topicTitle: string;
  /** Processing status of the lesson */
  status: 'generating' | 'ready' | 'error';
  /** Ordered array of slides */
  slides: SlideData[];
  /** Hierarchical course plan (chapters → topics → subtopics, arbitrary depth) */
  coursePlan: CoursePlan;
  /** Which chapter + topic path is currently active */
  currentPosition: {
    chapterIndex: number;
    /** Index path into the TopicNode tree, e.g. [1, 0, 2] = 2nd topic → 1st child → 3rd child */
    topicPath: number[];
  };
}
