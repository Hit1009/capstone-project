import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import type { TTSMark } from '../types/presentation';

// Use v1beta1 because enableTimePointing (SSML_MARK) only returns
// actual timepoint data with the beta API — v1 silently ignores it.
const { TextToSpeechClient } = textToSpeech.v1beta1;

// ── Output directory ─────────────────────────────────────────────────
const AUDIO_DIR = path.resolve(__dirname, '../../public/audio');

// Ensure audio directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// ── TTS Client (lazy init) ───────────────────────────────────────────

let client: InstanceType<typeof TextToSpeechClient> | null = null;

function getClient(): InstanceType<typeof TextToSpeechClient> {
  if (!client) {
    client = new TextToSpeechClient();
  }
  return client;
}

// ── Check if GCP credentials are available ───────────────────────────

export function isTTSAvailable(): boolean {
  return !!(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT
  );
}

// ── Generate audio for a single slide ────────────────────────────────

export interface TTSResult {
  audioUrl: string;
  audioDuration: number;
  timepoints: TTSMark[];
}

/**
 * Generate MP3 audio from SSML text and extract mark timestamps.
 * Returns audio URL, duration, and timepoints for fragment sync.
 * Falls back gracefully if TTS is unavailable.
 */
export async function generateSlideAudio(
  slideId: string,
  ssmlText: string
): Promise<TTSResult> {
  // Fallback if GCP credentials are not configured
  if (!isTTSAvailable()) {
    console.warn(`⚠️  TTS unavailable for ${slideId} — no GCP credentials. Slide will have no audio.`);
    return {
      audioUrl: `/audio/${slideId}.mp3`,
      audioDuration: 0,
      timepoints: [],
    };
  }

  try {
    const ttsClient = getClient();

    const [response] = await (ttsClient.synthesizeSpeech({
      input: { ssml: ssmlText },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Wavenet-F',
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
      },
      enableTimePointing: [1], // 1 = SSML_MARK in the v1beta1 proto enum
    }) as any);

    // Save the audio file
    const filename = path.join(AUDIO_DIR, `${slideId}.mp3`);
    fs.writeFileSync(filename, response.audioContent as Buffer);
    console.log(`✅ Generated audio: ${filename}`);

    // Process timepoints
    console.log(`[TTS DEBUG] Raw timepoints for ${slideId}:`, JSON.stringify(response.timepoints));
    const timepoints: TTSMark[] = (response.timepoints || []).map((tp: any) => {
      let fragIndex = 0;
      try {
        fragIndex = parseInt(tp.markName.split('-')[1], 10);
      } catch { /* keep 0 */ }

      return {
        markName: tp.markName,
        timeSeconds: Math.round((tp.timeSeconds || 0) * 100) / 100,
        fragmentIndex: fragIndex,
      };
    });
    console.log(`[TTS DEBUG] Processed timepoints for ${slideId}:`, JSON.stringify(timepoints));

    // Approximate duration from audio content size  
    const audioDuration = Math.round(((response.audioContent as Buffer).length / 32000) * 10) / 10;

    return {
      audioUrl: `/audio/${slideId}.mp3`,
      audioDuration,
      timepoints,
    };
  } catch (err) {
    console.error(`❌ TTS error for ${slideId}:`, err);
    return {
      audioUrl: `/audio/${slideId}.mp3`,
      audioDuration: 0,
      timepoints: [],
    };
  }
}

/**
 * Generate audio for multiple slides in sequence.
 */
export async function generateBatchAudio(
  slides: Array<{ id: string; ssml: string }>
): Promise<Map<string, TTSResult>> {
  const results = new Map<string, TTSResult>();

  for (const slide of slides) {
    const result = await generateSlideAudio(slide.id, slide.ssml);
    results.set(slide.id, result);
  }

  return results;
}
