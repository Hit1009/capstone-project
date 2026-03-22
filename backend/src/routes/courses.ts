import { Router, Request, Response } from 'express';
import { courses, getLessonPayload } from '../data/courses';

const router = Router();

/**
 * GET /api/courses
 * Returns the list of all courses (available + coming-soon).
 */
router.get('/courses', (_req: Request, res: Response) => {
  res.json(courses);
});

/**
 * GET /api/lessons/:courseId
 * Returns the full LessonPayload for a given course.
 * 404 if the course doesn't exist or has no lesson data.
 */
router.get('/lessons/:courseId', (req: Request, res: Response) => {
  const { courseId } = req.params;
  const lesson = getLessonPayload(courseId);

  if (!lesson) {
    res.status(404).json({
      error: 'Lesson not found',
      message: `No lesson data available for course "${courseId}".`,
    });
    return;
  }

  res.json(lesson);
});

export default router;
