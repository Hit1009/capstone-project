import { Router, Request, Response } from 'express';
import { generateCourse, generateDoubtSlides } from '../services/generate';
import { addDynamicLesson } from '../data/courses';

const router = Router();

// ── POST /api/generate-course ──────────────────────────────────────

interface GenerateCourseBody {
  topic: string;
}

/**
 * Generate a full AI course on any topic.
 * This is a synchronous (blocking) endpoint that takes 30-60 seconds.
 */
router.post('/generate-course', async (req: Request, res: Response): Promise<void> => {
  try {
    const { topic } = req.body as GenerateCourseBody;

    if (!topic?.trim()) {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    console.log(`\n📚 Received course generation request: "${topic}"`);

    // Generate the course (this takes a while)
    const lesson = await generateCourse(topic.trim());

    // Store it in the in-memory lesson map so it can be fetched via GET /api/lessons/:id
    addDynamicLesson(lesson.lessonId, lesson);

    res.json({
      courseId: lesson.lessonId,
      lesson,
    });
  } catch (err) {
    console.error('Course generation error:', err);

    if (err instanceof Error && err.message.includes('GEMINI_API_KEY')) {
      res.status(500).json({
        error: 'AI service not configured',
        message: 'The Gemini API key is not set.',
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to generate course',
      message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
    });
  }
});

// ── POST /api/doubt-slides ─────────────────────────────────────────

interface DoubtSlidesBody {
  question: string;
  courseId: string;
  slideIndex: number;
  slideContent: string;
  transcript: string;
}

/**
 * Generate branch slides to answer a student's doubt.
 * Returns 2-4 slides with audio instead of a text response.
 */
router.post('/doubt-slides', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, slideContent, transcript } = req.body as DoubtSlidesBody;

    if (!question?.trim()) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    console.log(`\n🤔 Received doubt slides request: "${question.slice(0, 60)}..."`);

    const slides = await generateDoubtSlides(
      question.trim(),
      slideContent || '',
      transcript || ''
    );

    res.json({ slides });
  } catch (err) {
    console.error('Doubt slides generation error:', err);

    res.status(500).json({
      error: 'Failed to generate explanation slides',
      message: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
    });
  }
});

export default router;
