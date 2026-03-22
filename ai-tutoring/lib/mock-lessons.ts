import type { LessonPayload } from '@/types/presentation';
import { mockLessonPayload } from './mock-lesson';
import { mockOsLessonPayload } from './mock-os-lesson';

// ── Course metadata for home page ──────────────────────────────────
export interface CourseInfo {
  id: string;
  title: string;
  description: string;
  icon: string; // Changed from emoji to icon identifier
  slideCount: number;
  status: 'available' | 'coming-soon';
}

// ── Courses Registry ───────────────────────────────────────────────
export const courses: CourseInfo[] = [
  {
    id: 'demo',
    title: 'AI Tutor Slide Control Demo',
    description: 'A demonstration of presentation APIs, fragment animations, and text-to-speech synchronization for LLM integration.',
    icon: 'Brain',
    slideCount: 5,
    status: 'available',
  },
  {
    id: 'os',
    title: 'Operating Systems',
    description: 'Explore process management, memory layout, PCBs, context switching, fork/exec, IPC, and scheduling — the core of how modern operating systems work.',
    icon: 'Cpu',
    slideCount: 15,
    status: 'available',
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    description: 'Master core data structures and algorithmic techniques essential for problem-solving and technical interviews.',
    icon: 'Binary',
    slideCount: 0,
    status: 'coming-soon',
  },
  {
    id: 'cn',
    title: 'Computer Networks',
    description: 'Understand how the internet works — from physical layers and routing protocols to application-level communication.',
    icon: 'Network',
    slideCount: 0,
    status: 'coming-soon',
  },
  {
    id: 'learn-anything',
    title: 'Learn Anything (AI Generator)',
    description: 'Generate and learn a comprehensive, interactive course on any topic you desire. Powered by advanced AI agents.',
    icon: 'Sparkles',
    slideCount: 0,
    status: 'coming-soon',
  },
];

// ── Lesson Lookup ──────────────────────────────────────────────────
const lessonMap: Record<string, LessonPayload> = {
  demo: mockLessonPayload,
  os: mockOsLessonPayload,
};

export function getLessonPayload(courseId: string): LessonPayload {
  return lessonMap[courseId] ?? mockLessonPayload;
}
