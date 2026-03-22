import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// ── Gemini client (initialized lazily) ─────────────────────────────

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// ── Request / Response types ───────────────────────────────────────

interface DoubtRequest {
  question: string;
  courseId: string;
  slideIndex: number;
  slideContent: string;
  transcript: string;
  history?: { role: 'user' | 'ai'; text: string }[];
}

interface DoubtResponse {
  answer: string;
}

// ── System prompt ──────────────────────────────────────────────────

function buildSystemPrompt(courseId: string, slideIndex: number, slideContent: string, transcript: string): string {
  return `You are an expert AI tutor for an interactive learning platform. You are currently teaching a lesson in the "${courseId}" course.

The student is on slide ${slideIndex + 1}. Here is the slide content they are viewing:

--- SLIDE CONTENT (Markdown) ---
${slideContent}
--- END SLIDE CONTENT ---

Here is the narration transcript for this slide:

--- TRANSCRIPT ---
${transcript}
--- END TRANSCRIPT ---

Your role:
- Answer the student's question clearly and concisely.
- Use the slide content and transcript as context — the student is asking about what they're currently learning.
- If the question is about something shown on the slide, refer to it directly.
- Use simple language and examples when helpful.
- Keep answers focused and not too long (2-4 paragraphs max).
- Use markdown formatting for clarity (bold, lists, code blocks if relevant).
- If the question is completely unrelated to the lesson, politely redirect them to the topic at hand.
- Be encouraging and supportive, like a real tutor.`;
}

// ── POST /api/doubt ────────────────────────────────────────────────

router.post('/doubt', async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, courseId, slideIndex, slideContent, transcript, history } = req.body as DoubtRequest;

    // Validate required fields
    if (!question?.trim()) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }
    if (courseId === undefined || slideIndex === undefined) {
      res.status(400).json({ error: 'courseId and slideIndex are required' });
      return;
    }

    // Build the conversation
    const systemPrompt = buildSystemPrompt(
      courseId,
      slideIndex,
      slideContent || '',
      transcript || ''
    );

    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: systemPrompt,
    });

    // Build chat history from previous messages if any
    const chatHistory = (history || []).map((msg) => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(question);
    const answer = result.response.text();

    const response: DoubtResponse = { answer };
    res.json(response);

  } catch (err) {
    console.error('Doubt API error:', err);

    if (err instanceof Error && err.message.includes('GEMINI_API_KEY')) {
      res.status(500).json({
        error: 'AI service not configured',
        message: 'The Gemini API key is not set. Please set the GEMINI_API_KEY environment variable.',
      });
      return;
    }

    res.status(500).json({
      error: 'Failed to get AI response',
      message: 'Something went wrong while processing your question. Please try again.',
    });
  }
});

export default router;
