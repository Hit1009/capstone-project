import type { LessonPayload } from '@/types/presentation';

// ── API Configuration ──────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Course Info type (matches backend) ─────────────────────────────

export interface CourseInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  slideCount: number;
  status: 'available' | 'coming-soon';
}

// ── API Functions ──────────────────────────────────────────────────

/**
 * Fetch all courses from the backend.
 */
export async function fetchCourses(): Promise<CourseInfo[]> {
  const res = await fetch(`${API_BASE}/api/courses`);
  if (!res.ok) {
    throw new Error(`Failed to fetch courses: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch a specific lesson payload from the backend.
 */
export async function fetchLesson(courseId: string): Promise<LessonPayload> {
  const res = await fetch(`${API_BASE}/api/lessons/${encodeURIComponent(courseId)}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Lesson "${courseId}" not found.`);
    }
    throw new Error(`Failed to fetch lesson: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * Get the full URL for an audio file served by the backend.
 */
export function getAudioUrl(path: string): string {
  // If the path is already absolute (starts with http), return as-is
  if (path.startsWith('http')) return path;
  // Otherwise prefix with the backend base URL
  return `${API_BASE}${path}`;
}

// ── Doubt Types ────────────────────────────────────────────────────

export interface DoubtMessage {
  role: 'user' | 'ai';
  text: string;
}

export interface AskDoubtParams {
  question: string;
  courseId: string;
  slideIndex: number;
  slideContent: string;
  transcript: string;
  history?: DoubtMessage[];
}

// ── Doubt API ──────────────────────────────────────────────────────

/**
 * Send a question to the AI tutor and get a context-aware response.
 */
export async function askDoubt(params: AskDoubtParams): Promise<{ answer: string }> {
  const res = await fetch(`${API_BASE}/api/doubt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Failed to get AI response: ${res.status}`);
  }
  return res.json();
}
