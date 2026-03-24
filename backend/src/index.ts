import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import coursesRouter from './routes/courses';
import doubtRouter from './routes/doubt';
import generateRouter from './routes/generate';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────

// Allow requests from the Next.js frontend (dev server)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Parse JSON request bodies (increased limit for generated course payloads)
app.use(express.json({ limit: '10mb' }));

// ── Static files ───────────────────────────────────────────────────

// Serve audio files from the backend's public/audio directory
const audioDir = path.resolve(__dirname, '../public/audio');
app.use('/audio', express.static(audioDir));

// ── API routes ─────────────────────────────────────────────────────

app.use('/api', coursesRouter);
app.use('/api', doubtRouter);
app.use('/api', generateRouter);

// ── Health check ───────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start server ───────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 AI Tutoring Backend running on http://localhost:${PORT}`);
  console.log(`   Audio dir: ${audioDir}`);
  console.log(`   API: http://localhost:${PORT}/api/courses`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

export default app;
