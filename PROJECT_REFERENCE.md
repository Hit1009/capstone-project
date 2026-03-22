# AI Tutor — Project Reference & Requirements

> **Last updated:** March 2026  
> **Status:** MVP with two demo courses, Express backend, audio-synced presentation engine  
> **For:** Future developers joining this capstone project

---

## 1. Vision & High-Level Concept

An **interactive virtual AI teacher** that mimics a human lecturer using:
- **Slides** (board) — Reveal.js presentations with fragment animations
- **Speech** (narration) — Google Cloud TTS with SSML `<mark>` tags for slide–audio synchronization
- **Interaction** (doubts/Q&A) — Planned: learner can pause and ask the AI tutor questions mid-lesson

The key innovation is **audio–visual synchronization**: as the TTS narrates, slide elements (fragments, highlights) appear at precise timestamps, making the experience feel like a live teacher pointing at the board.

### How a Lesson Works (Data Flow)

```
┌──────────────────────────────────────────────────────────────┐
│  Content Pipeline (offline / ahead-of-time)                  │
│  SSML script → Google TTS → MP3 audio + mark timestamps      │
│  Human expert → slide markdown + fragment annotations         │
│  Combined → LessonPayload JSON (stored in backend)            │
└──────────────────────┬───────────────────────────────────────┘
                       │ GET /api/lessons/:id
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Express Backend (port 5000)                                  │
│  Serves: LessonPayload JSON + static audio MP3s               │
└──────────────────────┬───────────────────────────────────────┘
                       │ fetch()
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  Next.js Frontend (port 3000)                                 │
│  RevealPresentation renders slides                            │
│  useAudioSync hook watches audio.currentTime                  │
│  At each mark timestamp → triggers nextFragment()             │
│  Result: fragments appear in sync with narration              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
capstone-project/
├── ai-tutoring/              ← Next.js 16 frontend (React 19, TypeScript, Tailwind 4)
│   ├── app/
│   │   ├── layout.tsx        ← Root layout (Geist font, metadata)
│   │   ├── globals.css       ← Design system (463 lines of custom CSS)
│   │   ├── page.tsx          ← Home page: course cards grid
│   │   └── learn/
│   │       └── page.tsx      ← Lesson viewer: slides + audio + sidebar
│   ├── components/
│   │   ├── RevealPresentation.tsx  ← Reveal.js wrapper with PresentationAPI
│   │   ├── AudioPlayer.tsx         ← Playback controls bar
│   │   ├── LessonSidebar.tsx       ← Course plan tree + progress
│   │   ├── TopBar.tsx              ← Header with breadcrumb + session controls
│   │   ├── TranscriptOverlay.tsx   ← Closed captions overlay
│   │   ├── DoubtPanel.tsx          ← Slide-out doubt panel (Coming Soon)
│   │   └── DebugControlPanel.tsx   ← Draggable debug overlay
│   ├── hooks/
│   │   └── useAudioSync.ts        ← Core audio↔fragment sync engine
│   ├── lib/
│   │   ├── api.ts                 ← Backend API client (fetchCourses, fetchLesson)
│   │   ├── mock-lesson.ts         ← Demo lesson data (kept for reference)
│   │   ├── mock-os-lesson.ts      ← OS lesson data (kept for reference)
│   │   └── mock-lessons.ts        ← Course registry (kept for reference)
│   ├── types/
│   │   └── presentation.ts       ← All shared TypeScript interfaces
│   ├── public/audio/              ← 22 MP3 files (TTS-generated)
│   └── speech.python              ← Google Cloud TTS generation script
│
└── backend/                  ← Express 4 + TypeScript server
    └── src/
        ├── index.ts              ← Entry: CORS, static audio, route mounting
        ├── routes/courses.ts     ← GET /api/courses, GET /api/lessons/:id
        ├── data/
        │   ├── courses.ts        ← Course registry + getLessonPayload()
        │   ├── mock-lesson.ts    ← Demo lesson (5 slides)
        │   └── mock-os-lesson.ts ← OS lesson (15 slides)
        └── types/
            └── presentation.ts   ← Backend copy of shared types
```

---

## 3. Type System (The API Contract)

All types are defined in `types/presentation.ts` (both frontend and backend copies). This is the **single source of truth** for how data is shaped.

### Core Types

| Type | Purpose |
|---|---|
| `LessonPayload` | Top-level response from `GET /api/lessons/:id` |
| `SlideData` | One slide: markdown, audio URL, duration, timepoints, transcript |
| `TTSMark` | A single timestamp: `{ markName, timeSeconds, fragmentIndex }` |
| `CoursePlan` | Hierarchical chapter → topic → subtopic tree |
| `TopicNode` | Recursive node with `slideIndices[]` for multi-slide topics |
| `Chapter` | Groups topics under a chapter heading |
| `CourseInfo` | Course card metadata (id, title, icon, slideCount, status) |
| `PresentationAPI` | Frontend-only: methods exposed by RevealPresentation via ref |
| `PresentationState` | Current slide/fragment index, progress, isFirst/isLast |

### Key Data Shape: `LessonPayload`

```typescript
{
  lessonId: string;
  topicTitle: string;
  status: 'generating' | 'ready' | 'error';
  slides: SlideData[];          // Ordered array of slides
  coursePlan: CoursePlan;       // Chapter/topic hierarchy for sidebar
  currentPosition: {            // Default active position
    chapterIndex: number;
    topicPath: number[];        // E.g. [1, 0, 2] = 2nd topic → 1st child → 3rd child
  };
}
```

### Key Data Shape: `SlideData`

```typescript
{
  id: string;
  slideIndex: number;
  rawMarkdown: string;          // Reveal.js markdown with fragment annotations
  audioUrl: string;             // e.g. "/audio/os-slide-0.mp3"
  audioDuration: number;        // seconds
  timepoints: TTSMark[];        // When to trigger each fragment
  transcript: string;           // Plain-text for closed captions
}
```

---

## 4. Component Reference

### `RevealPresentation` — Slide Engine
- **File:** `components/RevealPresentation.tsx`
- **Role:** Wraps Reveal.js as a React component. Initializes deck in `embedded` mode with Markdown plugin.
- **API exposed via `useImperativeHandle`:** `next()`, `prev()`, `goToSlide(i)`, `nextFragment()`, `prevFragment()`, `getState()`, `getTotalSlides()`, `isFirstSlide()`, `isLastSlide()`
- **Config:** No keyboard/controls/hash — all navigation driven programmatically by the audio sync engine
- **Props:** `markdownContent` (all slides joined by `---`), `onReady`, `onSlideChange`

### `useAudioSync` — Audio↔Fragment Sync Engine
- **File:** `hooks/useAudioSync.ts`
- **Role:** The core intelligence. Watches `audio.currentTime` via `onTimeUpdate` events. Compares against each slide's `TTSMark.timeSeconds`. When time passes a mark, calls `presentationRef.nextFragment()`.
- **Features:**
  - Auto-advance to next slide when audio ends
  - Auto-play on mount and slide change
  - Playback rate, volume, mute controls
  - Reset triggered marks on slide change or seek
  - Fallback mode when audio file is missing (`audioError` state)
- **Returns:** `{ state, controls, audioRef, audioEventHandlers }`

### `AudioPlayer` — Playback Controls
- **File:** `components/AudioPlayer.tsx`
- **Role:** Bottom bar with play/pause, prev/next slide, seekable progress bar, playback speed (0.75×–2×), volume slider, mute, caption toggle.
- **Styled with:** Custom CSS classes in `globals.css` (glassmorphism, indigo accent)

### `LessonSidebar` — Course Plan Navigation
- **File:** `components/LessonSidebar.tsx`
- **Role:** Left sidebar. Renders a recursive `TopicNode` tree or falls back to a flat slide list. Shows progress bar, completed/current/upcoming state per node. Hardcoded user avatar ("John Doe").
- **Key function:** `TopicNodeItem` — recursive component with expand/collapse, click-to-navigate via `onGoToSlide`

### `TopBar` — Header
- **File:** `components/TopBar.tsx`
- **Role:** Top header showing lesson title, breadcrumb path (chapter • topic • subtopic), Pause/Resume button, Ask Doubt button (disabled, "Coming Soon"), notifications bell, options menu.

### `TranscriptOverlay` — Closed Captions
- **File:** `components/TranscriptOverlay.tsx`
- **Role:** Absolutely positioned overlay at the bottom of the slide viewport. Shows current slide's transcript text on a dark blurred background. Toggleable.

### `DoubtPanel` — Slide-out Q&A
- **File:** `components/DoubtPanel.tsx`
- **Role:** Right-side slide-out panel. Currently shows "Coming Soon" placeholder. When opened, pauses audio. Close with Escape key or close button.

### `DebugControlPanel` — Dev Tools
- **File:** `components/DebugControlPanel.tsx`
- **Role:** Draggable floating panel showing live presentation state (slide index, fragment, progress). Buttons for manual slide/fragment navigation. Quick-jump to slides 0–5. **Should be removed or hidden in production.**

---

## 5. Backend Reference

### Express Server (`backend/src/index.ts`)
- **Port:** 5000 (configurable via `PORT` env var)
- **CORS:** Allows `http://localhost:3000` and `http://127.0.0.1:3000`
- **Static audio:** Serves from `../ai-tutoring/public/audio` at route `/audio/*` (no file duplication)

### API Routes (`backend/src/routes/courses.ts`)

| Method | Path | Response | Notes |
|---|---|---|---|
| `GET` | `/api/courses` | `CourseInfo[]` | All 5 courses |
| `GET` | `/api/lessons/:courseId` | `LessonPayload` | 404 if not found |
| `GET` | `/health` | `{ status, timestamp }` | Health check |
| `GET` | `/audio/:file.mp3` | Binary MP3 | Static file |

### Data Layer (`backend/src/data/`)
Currently in-memory mock data. To upgrade to a database:
1. Replace `courses.ts` → SQL queries for `CourseInfo`
2. Replace `mock-lesson.ts` / `mock-os-lesson.ts` → SQL queries for `LessonPayload`
3. Store audio in cloud storage (GCS/S3) and return URLs

---

## 6. TTS Pipeline (`speech.python`)

A standalone Python script that generates audio files from SSML:

1. **Input:** Array of `{ id, ssml }` objects — SSML scripted narration with `<mark name="frag-X"/>` tags inserted at fragment trigger points
2. **Process:** Calls Google Cloud TTS API (WaveNet en-US-Wavenet-F voice) with `enable_time_pointing=SSML_MARK`
3. **Output:**
   - MP3 files saved to `public/audio/{id}.mp3`
   - Console prints `timepoints` JSON with mark timestamps — copy-paste into lesson data files
4. **Requires:** `google-cloud-texttospeech` Python package + GCP credentials

### How `<mark>` Tags Create Synchronization

```xml
<speak>
    A program is just a passive file.
    <mark name="frag-0"/>  ← TTS records the exact time this point is reached
    A process is that program brought to life.
    <mark name="frag-1"/>  ← Another timestamp
</speak>
```

The TTS API returns timestamps for each mark. These become `TTSMark.timeSeconds` in `SlideData.timepoints`. At runtime, `useAudioSync` calls `nextFragment()` when `audio.currentTime >= mark.timeSeconds`.

---

## 7. Design System

### CSS Architecture
- **Framework:** Tailwind CSS 4 for layout/utility classes
- **Custom CSS:** `globals.css` for component-specific styles (audio player, transcript overlay, doubt panel)
- **Fonts:** Geist Sans + Geist Mono (Google Fonts, loaded in `layout.tsx`)

### CSS Variables
```css
--background: #ffffff;
--foreground: #0f172a;
--accent: #6366f1;        /* Indigo-500 */
--accent-light: #e0e7ff;  /* Indigo-100 */
--surface: #f8fafc;
--border: #e2e8f0;
--text-muted: #94a3b8;
```

### Component Aesthetic Patterns
- **Glassmorphism:** Audio player bar uses `backdrop-filter: blur(16px)` with semi-transparent background
- **Smooth transitions:** 300ms ease-in-out on sidebar width, panel slides, button hovers
- **Indigo accent palette:** Primary actions use indigo-500/600, active states use indigo-50/100
- **Rounded corners:** 8px for buttons, 12px for panels, 24px for course cards

---

## 8. Existing Content

### Demo Course (id: `demo`, 5 slides)
A test lesson demonstrating fragment types: basic fragments, highlight colors (red/green/blue), and a multiplexer digital logic example with color-coded elements.

### OS Course (id: `os`, 15 slides)
A full lecture on Process Management: process vs program, memory layout (text/data/heap/stack), PCB fields, 5 process states, state transition diagram (inline SVG), context switches and their cost, fork()/exec() system calls, zombie/orphan processes, IPC (shared memory vs message passing), pipes, and CPU scheduling criteria.

### Coming Soon (data-only, no lessons)
- `dsa` — Data Structures & Algorithms
- `cn` — Computer Networks
- `learn-anything` — AI-generated courses on any topic

---

## 9. Feature Requirements (Complete SRS)

### ✅ Implemented (P0 — Core)

| # | Feature | Status |
|---|---|---|
| F1 | Reveal.js slide rendering with Markdown | ✅ Done |
| F2 | Fragment animation sync with TTS audio | ✅ Done |
| F3 | Audio player with play/pause/seek/speed/volume | ✅ Done |
| F4 | Auto-advance to next slide when audio ends | ✅ Done |
| F5 | Closed captions (transcript overlay) | ✅ Done, on by default |
| F6 | Course plan sidebar with tree navigation | ✅ Done |
| F7 | Multi-slide topic support in course plan | ✅ Done |
| F8 | Breadcrumb showing current chapter/topic | ✅ Done |
| F9 | Home page with course card grid | ✅ Done |
| F10 | Express backend serving lesson data | ✅ Done |
| F11 | Backend static audio file serving | ✅ Done |
| F12 | Loading/error states on both pages | ✅ Done |
| F13 | Keyboard shortcut: Space to play/pause | ✅ Done |
| F14 | Debug control panel (draggable) | ✅ Done (dev-only) |
| F15 | TTS generation pipeline (Python) | ✅ Done |

### 🚧 Planned (P1 — Near-term)

| # | Feature | Description |
|---|---|---|
| F16 | **Ask Doubt (Q&A)** | Pause session, type/speak a question. AI responds with context from current lesson. UI shell exists (`DoubtPanel.tsx`), needs LLM integration. |
| F17 | **Authentication (SSO)** | Google/Apple/X sign-in via Firebase Auth or similar. Currently hardcoded "John Doe" user. |
| F18 | **User progress persistence** | Save slide position + completion per user in database. Resume where left off. |
| F19 | **Database integration** | Replace in-memory mock data with PostgreSQL (Prisma ORM recommended). Schema: users, courses, lessons, slides, progress. |
| F20 | **AI viva/interaction** | AI tutor proactively asks comprehension questions mid-lesson to check understanding. |

### 🔮 Planned (P2 — Future)

| # | Feature | Description |
|---|---|---|
| F21 | **"Learn Anything" AI course generation** | User enters a topic → LLM generates syllabus, slides, and narration. Background processing job. |
| F22 | **Real-time content generation** | For novel topics, generate slides + TTS on-the-fly (lower quality but covers arbitrary topics). |
| F23 | **Voice input for doubts** | Speech-to-text for the doubt panel (browser MediaRecorder API or Whisper). |
| F24 | **Session tailoring** | Based on viva results, AI adjusts difficulty/depth of subsequent slides. |
| F25 | **Slide action sync** | Highlight specific elements, animate arrows, zoom into SVGs — synced with narration (SSML-driven). |
| F26 | **Multi-segment TTS** | Split narration into segments with action timestamps calculated from individual segment durations (see SRS "challenging part"). |
| F27 | **Mobile/responsive layout** | Current layout is desktop-only. Sidebar should collapse to overlay on mobile. |

---

## 10. Running the Project

### Prerequisites
- Node.js 18+
- npm
- Python 3.9+ with `google-cloud-texttospeech` (only for generating new audio)
- Google Cloud credentials (only for TTS)

### Development

```bash
# Terminal 1: Backend
cd backend
npm install         # first time
npm run dev         # → http://localhost:5000

# Terminal 2: Frontend
cd ai-tutoring
npm install         # first time
npm run dev         # → http://localhost:3000
```

### Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` (backend) | `5000` | Express server port |
| `NEXT_PUBLIC_API_URL` (frontend) | `http://localhost:5000` | Backend URL override |
| `GOOGLE_APPLICATION_CREDENTIALS` (Python) | — | GCP service account JSON (for TTS only) |

---

## 11. Key Architectural Decisions

1. **Reveal.js in `embedded` mode** — No keyboard/hash/controls. All navigation is programmatic via `PresentationAPI`, so the audio sync engine has full control.
2. **Audio sync via `onTimeUpdate` polling** — Not using Web Audio API or requestAnimationFrame. Simple and reliable. The `timeUpdate` event fires ~4× per second which is sufficient for fragment triggers.
3. **Markdown slides stitched with `---`** — All slides are joined into one giant markdown string separated by `---`, which is how Reveal.js Markdown plugin expects them.
4. **Separate Express backend** (not Next.js API Routes) — Chosen because: (a) Python TTS worker doesn't fit in serverless, (b) "Learn Anything" needs background processing, (c) clearer client-server architecture for a capstone.
5. **Audio served from frontend's `public/` dir** — Backend does `express.static('../ai-tutoring/public/audio')`. No file duplication. In production, move to cloud storage.
6. **Types duplicated** (not shared package) — `types/presentation.ts` exists in both frontend and backend. Acceptable for now; use a monorepo shared package (e.g. Turborepo) when the project grows.

---

## 12. Known Issues & Tech Debt

| Issue | Severity | Notes |
|---|---|---|
| Hardcoded "John Doe" user in sidebar | Low | Replace with auth-driven user data |
| DebugControlPanel hardcodes slides 0–5 | Low | Should dynamically reflect total slides |
| No production build/deploy setup | Medium | Add Docker, CI/CD, environment configs |
| Types duplicated across frontend/backend | Low | Consider shared package if adding more services |
| `speech.python` is not integrated into backend | Medium | Currently a standalone CLI script; should become a backend API/worker |
| Audio duration is approximated in TTS script | Low | `len(audio_content) / 32000` is a rough estimate; actual duration comes from `loadedmetadata` event |
| No error boundary in React | Medium | Unhandled errors crash the whole page |
| `useAudioSync` has a lot of refs for stale closure avoidance | Low | Works fine but could be simplified with `useReducer` |
