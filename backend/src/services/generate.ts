import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateSlideAudio, type TTSResult } from './tts';
import type { LessonPayload, SlideData, CoursePlan } from '../types/presentation';

// ── Gemini client (reuse from doubt.ts pattern) ──────────────────────

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

// ── Types for LLM output ─────────────────────────────────────────────

interface GeneratedSlide {
  id: string;
  rawMarkdown: string;
  ssml: string;
  transcript: string;
}

interface GeneratedCourse {
  topicTitle: string;
  slides: GeneratedSlide[];
  coursePlan: CoursePlan;
}

interface GeneratedDoubtSlides {
  slides: GeneratedSlide[];
}

// ── Course Generation Prompt ─────────────────────────────────────────

function buildCoursePrompt(topic: string): string {
  return `You are an expert educational content creator for an AI tutoring platform.

Generate a comprehensive course on: "${topic}"

You MUST respond with ONLY valid JSON (no markdown code fences, no explanation). The JSON must follow this exact structure:

{
  "topicTitle": "Display title for the course",
  "slides": [
    {
      "id": "slide-0",
      "rawMarkdown": "Reveal.js markdown content for this slide",
      "ssml": "<speak>SSML narration for this slide</speak>",
      "transcript": "Plain text version of the narration"
    }
  ],
  "coursePlan": {
    "courseTitle": "Full course title",
    "chapters": [
      {
        "id": "ch-1",
        "title": "Chapter Title",
        "topics": [
          {
            "id": "t-topic-1",
            "title": "Topic Title",
            "slideIndices": [0],
            "children": []
          }
        ]
      }
    ]
  }
}

RULES FOR SLIDES (generate 8-12 slides):

1. **Slide 0** — Title slide. Simple heading with subtitle. No fragments.

2. **Content slides (1 to N-1)** — Each slide should:
   - Use Reveal.js markdown with fragment annotations
   - Include 2-5 fragments per slide using: <!-- .element: class="fragment" data-fragment-index="X" -->
   - Use tables, code blocks, bold text, bullet points as appropriate
   - Fragments should reveal content progressively

3. **Last slide** — Summary/key takeaways slide with fragments.

RULES FOR SSML:
- Wrap all SSML in <speak> tags
- Insert <mark name="frag-X"/> tags at the exact points where each fragment should appear
- Use <break time="300ms"/> to <break time="500ms"/> for natural pauses
- The narration should be detailed, educational, and engaging (like a professor lecturing)
- Each slide's SSML should be 30-60 seconds of narration

RULES FOR COURSE PLAN:
- Group slides into logical chapters and topics
- Each topic should have slideIndices pointing to the relevant slides
- Use a hierarchical structure with children for subtopics

RULES FOR RAWMARKDOWN:
- Use ## for slide titles (not # which is for the title slide)
- Fragment annotations go on the same line as the content or on the line below
- For bullet points: - **Content** <!-- .element: class="fragment" data-fragment-index="0" -->
- For table rows, put the annotation after the row: | Cell | Cell | <!-- .element: class="fragment" data-fragment-index="0" -->
- For code blocks, put the annotation on the line after the closing backticks
- Fragment indices should start at 0 and increment per slide

Make the content detailed, accurate, and educationally valuable. The narration should explain concepts thoroughly, use analogies, and build understanding progressively.`;
}

// ── Doubt Slides Prompt ──────────────────────────────────────────────

function buildDoubtSlidesPrompt(
  question: string,
  slideContent: string,
  transcript: string
): string {
  return `You are an expert AI tutor. A student asked a doubt while studying. Instead of text, respond with teaching slides.

The student is currently viewing this slide:
--- SLIDE CONTENT ---
${slideContent}
--- END SLIDE ---

The narration transcript was:
--- TRANSCRIPT ---
${transcript}
--- END TRANSCRIPT ---

The student's question is: "${question}"

Generate 2-4 slides that thoroughly answer this doubt with visual aids, examples, and clear explanations.

You MUST respond with ONLY valid JSON (no markdown code fences, no explanation):

{
  "slides": [
    {
      "id": "doubt-slide-0",
      "rawMarkdown": "Reveal.js markdown with fragment annotations",
      "ssml": "<speak>SSML narration with <mark> tags</speak>",
      "transcript": "Plain text narration"
    }
  ]
}

RULES:
1. Slide IDs must be "doubt-slide-0", "doubt-slide-1", etc.
2. First slide should directly address the question with a clear title
3. Use 2-4 fragments per slide with <!-- .element: class="fragment" data-fragment-index="X" -->
4. SSML must have <mark name="frag-X"/> tags matching the fragment indices
5. Use <break time="300ms"/> to <break time="500ms"/> for natural pauses
6. Narration should be detailed and educational (20-40 seconds per slide)
7. Use tables, code blocks, analogies, and bold text for clarity
8. Last slide should summarize and connect back to the original topic`;
}

// ── Parse JSON from LLM response ─────────────────────────────────────

function parseJsonResponse(text: string): any {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}

// ── Generate Course ──────────────────────────────────────────────────

/**
 * Generate a full course on any topic using Gemini + Google TTS.
 * Returns a complete LessonPayload ready for the frontend.
 */
export async function generateCourse(topic: string): Promise<LessonPayload> {
  console.log(`\n🚀 Generating course on: "${topic}"...`);

  // Step 1: Generate course content with Gemini
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16000,
    },
  });

  const prompt = buildCoursePrompt(topic);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  let courseData: GeneratedCourse;
  try {
    courseData = parseJsonResponse(responseText);
  } catch (err) {
    console.error('❌ Failed to parse Gemini response as JSON');
    console.error('Raw response:', responseText.slice(0, 500));
    throw new Error('Failed to generate course content. The AI response was not valid JSON.');
  }

  console.log(`📝 Generated ${courseData.slides.length} slides for "${courseData.topicTitle}"`);

  // Step 2: Generate audio for each slide
  const lessonId = `gen-${Date.now()}`;
  const slides: SlideData[] = [];

  for (let i = 0; i < courseData.slides.length; i++) {
    const slide = courseData.slides[i];
    const slideId = `${lessonId}-slide-${i}`;

    console.log(`🔊 Generating audio for slide ${i + 1}/${courseData.slides.length}...`);

    let ttsResult: TTSResult;
    try {
      ttsResult = await generateSlideAudio(slideId, slide.ssml);
    } catch (err) {
      console.warn(`⚠️  TTS failed for slide ${i}, using fallback`);
      ttsResult = {
        audioUrl: `/audio/${slideId}.mp3`,
        audioDuration: 0,
        timepoints: [],
      };
    }

    slides.push({
      id: slideId,
      slideIndex: i,
      rawMarkdown: slide.rawMarkdown,
      audioUrl: ttsResult.audioUrl,
      audioDuration: ttsResult.audioDuration,
      timepoints: ttsResult.timepoints,
      transcript: slide.transcript,
    });
  }

  // Step 3: Assemble the LessonPayload
  const lessonPayload: LessonPayload = {
    lessonId,
    topicTitle: courseData.topicTitle,
    status: 'ready',
    slides,
    coursePlan: courseData.coursePlan,
    currentPosition: {
      chapterIndex: 0,
      topicPath: [0],
    },
  };

  console.log(`✨ Course "${courseData.topicTitle}" generated successfully!\n`);
  return lessonPayload;
}

// ── Generate Doubt Slides ────────────────────────────────────────────

/**
 * Generate 2-4 branch slides that answer a student's doubt.
 * Returns SlideData array ready for injection into the lesson.
 */
export async function generateDoubtSlides(
  question: string,
  slideContent: string,
  transcript: string
): Promise<SlideData[]> {
  console.log(`\n🤔 Generating doubt slides for: "${question.slice(0, 60)}..."`);

  // Step 1: Generate slide content with Gemini
  const ai = getGenAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8000,
    },
  });

  const prompt = buildDoubtSlidesPrompt(question, slideContent, transcript);
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  let doubtData: GeneratedDoubtSlides;
  try {
    doubtData = parseJsonResponse(responseText);
  } catch (err) {
    console.error('❌ Failed to parse doubt slides response');
    throw new Error('Failed to generate doubt explanation. Please try again.');
  }

  console.log(`📝 Generated ${doubtData.slides.length} doubt slides`);

  // Step 2: Generate audio for each doubt slide
  const timestamp = Date.now();
  const slides: SlideData[] = [];

  for (let i = 0; i < doubtData.slides.length; i++) {
    const slide = doubtData.slides[i];
    const slideId = `doubt-${timestamp}-slide-${i}`;

    console.log(`🔊 Generating audio for doubt slide ${i + 1}/${doubtData.slides.length}...`);

    let ttsResult: TTSResult;
    try {
      ttsResult = await generateSlideAudio(slideId, slide.ssml);
    } catch (err) {
      console.warn(`⚠️  TTS failed for doubt slide ${i}, using fallback`);
      ttsResult = {
        audioUrl: `/audio/${slideId}.mp3`,
        audioDuration: 0,
        timepoints: [],
      };
    }

    slides.push({
      id: slideId,
      slideIndex: i, // will be re-indexed when injected
      rawMarkdown: slide.rawMarkdown,
      audioUrl: ttsResult.audioUrl,
      audioDuration: ttsResult.audioDuration,
      timepoints: ttsResult.timepoints,
      transcript: slide.transcript,
    });
  }

  console.log(`✨ Doubt slides generated successfully!\n`);
  return slides;
}
