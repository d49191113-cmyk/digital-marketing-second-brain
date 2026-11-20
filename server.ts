import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  createCategory,
  createConnection,
  createFlashcard,
  createQuizQuestion,
  createResource,
  createTopic,
  deleteConnection,
  deleteResource,
  deleteTopic,
  getProfile,
  getWorkspaceData,
  loginUser,
  logoutSession,
  logStudyActivity,
  markTopicViewed,
  registerUser,
  resolveUserFromToken,
  reviewFlashcard,
  updateProfileSettings,
  updateTopic,
} from './server/db';
import { validateTopicInput } from './src/utils/knowledgeLogic';

const app = express();
app.use(express.json({ limit: '5mb' }));

function getTokenFromReq(req: express.Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

function getUserId(req: express.Request): string {
  return resolveUserFromToken(getTokenFromReq(req));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Authentication
app.get('/api/auth/session', (req, res) => {
  const userId = getUserId(req);
  res.json({ profile: getProfile(userId) });
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, displayName } = req.body ?? {};
    if (!email || !password || String(password).length < 6) {
      return res.status(400).json({ error: 'Valid email and password (min 6 characters) are required.' });
    }
    const result = registerUser(String(email), String(password), String(displayName || 'Explorer'));
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Registration failed.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = loginUser(String(email), String(password));
    return res.json(result);
  } catch (err) {
    return res.status(401).json({ error: err instanceof Error ? err.message : 'Invalid credentials.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  logoutSession(getTokenFromReq(req));
  res.json({ ok: true });
});

// Workspace & Settings
app.get('/api/workspace', (req, res) => {
  const userId = getUserId(req);
  res.json(getWorkspaceData(userId));
});

app.patch('/api/settings', (req, res) => {
  const userId = getUserId(req);
  const profile = updateProfileSettings(userId, req.body ?? {});
  res.json({ profile });
});

app.get('/api/supabase-schema', (_req, res) => {
  const schemaPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  const sql = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf-8') : '';
  res.json({ sql });
});

// Categories
app.post('/api/categories', (req, res) => {
  const userId = getUserId(req);
  const { name, nameKm, description, color } = req.body ?? {};
  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'Category name must be at least 2 characters.' });
  }
  const category = createCategory(userId, {
    name: String(name),
    nameKm: nameKm ? String(nameKm) : undefined,
    description: String(description || 'Custom Digital Marketing domain'),
    color: String(color || '#E5B85C'),
  });
  return res.status(201).json({ category });
});

// Topics & Notes
app.post('/api/topics', (req, res) => {
  const userId = getUserId(req);
  const body = req.body ?? {};
  const check = validateTopicInput({
    title: String(body.title ?? ''),
    categoryId: String(body.categoryId ?? ''),
    shortDefinition: String(body.shortDefinition ?? ''),
  });
  if (!check.valid) {
    return res.status(400).json({ error: check.errors.join(' ') });
  }
  const topic = createTopic(userId, {
    categoryId: String(body.categoryId),
    title: String(body.title),
    titleKm: String(body.titleKm || body.title),
    shortDefinition: String(body.shortDefinition),
    simpleExplanation: String(body.simpleExplanation || body.shortDefinition),
    detailedExplanation: String(body.detailedExplanation || ''),
    keyConcepts: Array.isArray(body.keyConcepts) ? body.keyConcepts : [],
    practicalExamples: Array.isArray(body.practicalExamples) ? body.practicalExamples : [],
    realWorldApplications: Array.isArray(body.realWorldApplications) ? body.realWorldApplications : [],
    stepByStepGuide: Array.isArray(body.stepByStepGuide) ? body.stepByStepGuide : [],
    terminology: Array.isArray(body.terminology) ? body.terminology : [],
    personalNotesHtml: String(body.personalNotesHtml || ''),
    externalResources: Array.isArray(body.externalResources) ? body.externalResources : [],
    referencesList: Array.isArray(body.referencesList) ? body.referencesList : [],
    attachments: Array.isArray(body.attachments) ? body.attachments : [],
    tags: Array.isArray(body.tags) ? body.tags : [],
    status: body.status || 'not_started',
    isFavorite: Boolean(body.isFavorite),
  });
  return res.status(201).json({ topic });
});

app.patch('/api/topics/:id', (req, res) => {
  const userId = getUserId(req);
  const topic = updateTopic(userId, req.params.id, req.body ?? {});
  if (!topic) {
    return res.status(404).json({ error: 'Topic not found.' });
  }
  return res.json({ topic });
});

app.post('/api/topics/:id/view', (req, res) => {
  const userId = getUserId(req);
  markTopicViewed(userId, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/topics/:id', (req, res) => {
  const userId = getUserId(req);
  const deleted = deleteTopic(userId, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Topic not found.' });
  }
  return res.json({ ok: true });
});

// Topic Connections
app.post('/api/connections', (req, res) => {
  const userId = getUserId(req);
  const { sourceTopicId, targetTopicId, relationshipLabel } = req.body ?? {};
  if (!sourceTopicId || !targetTopicId || sourceTopicId === targetTopicId) {
    return res.status(400).json({ error: 'Select two distinct topics to connect.' });
  }
  const connection = createConnection(
    userId,
    String(sourceTopicId),
    String(targetTopicId),
    String(relationshipLabel || 'Related to')
  );
  return res.status(201).json({ connection });
});

app.delete('/api/connections/:id', (req, res) => {
  const userId = getUserId(req);
  const deleted = deleteConnection(userId, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Connection not found.' });
  return res.json({ ok: true });
});

// Learning Center: Flashcards, Quizzes, Logs
app.post('/api/flashcards', (req, res) => {
  const userId = getUserId(req);
  const { topicId, categoryId, front, back, backKm } = req.body ?? {};
  if (!categoryId || !front || !back) {
    return res.status(400).json({ error: 'Category, front prompt, and back answer are required.' });
  }
  const flashcard = createFlashcard(userId, { topicId, categoryId, front, back, backKm });
  return res.status(201).json({ flashcard });
});

app.patch('/api/flashcards/:id/review', (req, res) => {
  const userId = getUserId(req);
  const { masteryLevel } = req.body ?? {};
  reviewFlashcard(userId, req.params.id, Number(masteryLevel ?? 1));
  res.json({ ok: true });
});

app.post('/api/quizzes', (req, res) => {
  const userId = getUserId(req);
  const { topicId, categoryId, question, options, correctIndex, explanation } = req.body ?? {};
  if (!categoryId || !question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Valid question, category, and at least 2 options are required.' });
  }
  const quiz = createQuizQuestion(userId, {
    topicId: topicId ?? null,
    categoryId: String(categoryId),
    question: String(question),
    options: options.map(String),
    correctIndex: Number(correctIndex ?? 0),
    explanation: String(explanation || ''),
  });
  return res.status(201).json({ quiz });
});

app.post('/api/study-logs', (req, res) => {
  const userId = getUserId(req);
  const { activityType, summary, points, topicId } = req.body ?? {};
  if (!summary) return res.status(400).json({ error: 'Summary is required.' });
  const log = logStudyActivity(
    userId,
    activityType || 'quiz_completed',
    String(summary),
    Number(points ?? 3),
    topicId ?? null
  );
  return res.status(201).json({ log });
});

// Resources
app.post('/api/resources', (req, res) => {
  const userId = getUserId(req);
  const { categoryId, topicId, title, url, resourceType, description } = req.body ?? {};
  if (!categoryId || !title || !url) {
    return res.status(400).json({ error: 'Title, category, and URL are required.' });
  }
  const resource = createResource(userId, {
    categoryId: String(categoryId),
    topicId: topicId ?? null,
    title: String(title),
    url: String(url),
    resourceType: resourceType || 'guide',
    description: String(description || ''),
  });
  return res.status(201).json({ resource });
});

app.delete('/api/resources/:id', (req, res) => {
  const userId = getUserId(req);
  const deleted = deleteResource(userId, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Resource not found.' });
  return res.json({ ok: true });
});

// Server-side Gemini AI Learning Assistant
app.post('/api/ai/assist', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim().length < 10) {
    return res.status(503).json({
      error:
        'GEMINI_API_KEY is not configured on the server. Add your Gemini API key in Settings > Secrets to enable the AI Learning Assistant.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  try {
    const { mode, prompt, topicTitle, topicContext, language } = req.body ?? {};
    if (!prompt && !topicTitle) {
      return res.status(400).json({ error: 'Please provide a marketing topic or question.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const targetLang = language === 'km' ? 'Khmer (keeping standard Digital Marketing terms in English alongside Khmer explanations)' : 'clear, practical English';

    if (mode === 'flashcards') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate 4 high-yield Digital Marketing flashcards about "${topicTitle || prompt}". Context: ${topicContext || 'General Digital Marketing'}. Include both English back and Khmer backKm.`,
        config: {
          systemInstruction:
            'You are a Digital Marketing mentor. Keep Digital Marketing terminology (SEO, CTR, ROAS, CPA, GA4) in English even in Khmer translations.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
                backKm: { type: Type.STRING },
              },
              required: ['front', 'back', 'backKm'],
            },
          },
        },
      });
      const flashcards = JSON.parse((response.text ?? '[]').trim());
      return res.json({ mode: 'flashcards', flashcards });
    }

    if (mode === 'quiz') {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Create 3 practical multiple-choice quiz questions testing real-world application of "${topicTitle || prompt}". Context: ${topicContext || ''}.`,
        config: {
          systemInstruction: 'You are an expert Digital Marketing educator writing scenario-based quiz questions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
      });
      const quizzes = JSON.parse((response.text ?? '[]').trim());
      return res.json({ mode: 'quiz', quizzes });
    }

    const modeInstructions: Record<string, string> = {
      explain_simple: `Explain this concept in simple, everyday ${targetLang} with a crystal-clear analogy.`,
      translate_khmer:
        'Translate and explain this Digital Marketing concept clearly in Khmer Unicode (ភាសាខ្មែរ), keeping technical Digital Marketing terms (like SEO, CPC, ROAS, GA4, Funnel) in English in parentheses so the learner learns international industry vocabulary.',
      summarize: `Summarize the core takeaways, decision rules, and mistakes to avoid in ${targetLang}.`,
      examples: `Provide 3 concrete real-world Digital Marketing examples with numbers and channel tactics in ${targetLang}.`,
      terminology: `Break down the 5–7 most important industry terms and metrics related to this topic in ${targetLang}.`,
      study_plan: `Create an actionable 7-day study and hands-on practice plan in ${targetLang}.`,
      related: `Recommend 5 closely connected Digital Marketing concepts and explain how each links together in ${targetLang}.`,
      chat: `Answer the user's Digital Marketing question thoroughly yet concisely in ${targetLang}.`,
    };

    const instruction = modeInstructions[String(mode || 'chat')] || modeInstructions.chat;
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Topic: ${topicTitle || 'Digital Marketing'}\nContext: ${topicContext || 'N/A'}\nRequest: ${prompt || mode}\n\nInstruction: ${instruction}`,
      config: {
        systemInstruction:
          'You are a world-class Digital Marketing Second Brain Mentor. Be structured, practical, concise, and avoid fluff.',
      },
    });

    return res.json({ mode: mode || 'chat', text: response.text ?? '' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gemini request failed.';
    return res.status(500).json({ error: message });
  }
});

async function startServer() {
  const port = Number(process.env.PORT || 3000);
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Digital Marketing Second Brain running on http://localhost:${port}`);
  });
}

startServer();
