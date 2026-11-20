import { useState } from 'react';
import { AlertCircle, Bot, Check, Send, Sparkles } from 'lucide-react';
import type { Category, Language, QuizQuestion, Topic } from '../../types/knowledge';
import { api } from '../../services/api';

interface AIAssistantViewProps {
  topics: Topic[];
  categories: Category[];
  language: Language;
  aiConfigured: boolean;
  initialTopic?: Topic | null;
  onSaveGeneratedFlashcards: (
    cards: Array<{ front: string; back: string; backKm?: string }>,
    topicId?: string | null,
    categoryId?: string
  ) => Promise<void>;
  onSaveGeneratedQuiz: (
    quizzes: Array<Omit<QuizQuestion, 'id'>>
  ) => Promise<void>;
}

const AI_MODES = [
  { id: 'explain_simple', label: 'Explain Simply (EN)' },
  { id: 'translate_khmer', label: 'Translate to Khmer (ខ្មែរ)' },
  { id: 'summarize', label: 'Summarize Key Rules' },
  { id: 'examples', label: 'Practical Examples' },
  { id: 'terminology', label: 'Terminology Breakdown' },
  { id: 'study_plan', label: '7-Day Study Plan' },
  { id: 'related', label: 'Recommend Related Topics' },
  { id: 'flashcards', label: 'Generate Flashcards' },
  { id: 'quiz', label: 'Generate Quiz' },
];

export function AIAssistantView({
  topics,
  categories,
  language,
  aiConfigured,
  initialTopic,
  onSaveGeneratedFlashcards,
  onSaveGeneratedQuiz,
}: AIAssistantViewProps) {
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopic?.id ?? topics[0]?.id ?? '');
  const [mode, setMode] = useState('explain_simple');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [responseText, setResponseText] = useState('');
  const [generatedCards, setGeneratedCards] = useState<
    Array<{ front: string; back: string; backKm: string }>
  >([]);
  const [generatedQuizzes, setGeneratedQuizzes] = useState<
    Array<{ question: string; options: string[]; correctIndex: number; explanation: string }>
  >([]);
  const [savedNotice, setSavedNotice] = useState('');

  const activeTopic = topics.find((t) => t.id === selectedTopicId);

  const runAssist = async (overrideMode?: string) => {
    const activeMode = overrideMode || mode;
    setLoading(true);
    setError('');
    setSavedNotice('');
    setResponseText('');
    setGeneratedCards([]);
    setGeneratedQuizzes([]);

    try {
      const res = await api.aiAssist({
        mode: activeMode,
        prompt: prompt.trim() || activeTopic?.title || 'Digital Marketing fundamentals',
        topicTitle: activeTopic?.title,
        topicContext: activeTopic
          ? `${activeTopic.shortDefinition} ${activeTopic.detailedExplanation}`
          : undefined,
        language,
      });

      if (res.flashcards) {
        setGeneratedCards(res.flashcards);
      } else if (res.quizzes) {
        setGeneratedQuizzes(res.quizzes);
      } else if (res.text) {
        setResponseText(res.text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#E5B85C]" />
            <span>AI Learning Assistant</span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Powered server-side by Gemini to explain, translate into Khmer, summarize, and build study drills.
          </p>
        </div>
      </div>

      {!aiConfigured && (
        <div
          role="status"
          className="liquid-glass rounded-2xl border-amber-500/35 bg-amber-500/[0.08] p-4 flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-100">
            <p className="font-medium">Gemini AI API Key Not Connected</p>
            <p className="mt-1 text-xs text-amber-200/85 leading-relaxed">
              Add <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code> in
              the AI Studio <strong>Settings &gt; Secrets</strong> panel to enable live explanations, Khmer
              translations, and flashcard/quiz generation.
            </p>
          </div>
        </div>
      )}

      <div className="liquid-glass rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ai-topic-select" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Ground in Knowledge Topic
            </label>
            <select
              id="ai-topic-select"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="glass-input w-full rounded-xl px-3 py-2 text-sm bg-[#0C101B]"
            >
              <option value="">General Digital Marketing</option>
              {topics.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ai-mode-select" className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Learning Action
            </label>
            <select
              id="ai-mode-select"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="glass-input w-full rounded-xl px-3 py-2 text-sm bg-[#0C101B]"
            >
              {AI_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {AI_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                runAssist(m.id);
              }}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap active:scale-[0.98] ${
                mode === m.id
                  ? 'border-[#E5B85C]/50 bg-[#E5B85C]/15 text-[#E5B85C]'
                  : 'border-white/[0.10] bg-white/[0.03] text-[#A1A1AA] hover:text-[#F5F5F7]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAssist();
          }}
          className="flex gap-2"
        >
          <label htmlFor="ai-prompt-input" className="sr-only">
            Ask a Digital Marketing question
          </label>
          <input
            id="ai-prompt-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a specific question, paste campaign notes to summarize, or request a study plan..."
            className="glass-input flex-1 rounded-xl px-3.5 py-2.5 text-sm placeholder-[#A1A1AA]"
          />
          <button
            type="submit"
            disabled={loading}
            className="liquid-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{loading ? 'Thinking...' : 'Run Assistant'}</span>
          </button>
        </form>
      </div>

      {error && (
        <div role="alert" className="liquid-glass rounded-2xl border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {savedNotice && (
        <div className="liquid-glass rounded-2xl border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-200 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{savedNotice}</span>
        </div>
      )}

      {responseText && (
        <article className="liquid-glass rounded-2xl p-6">
          <div className="flex items-center gap-2 text-xs text-[#E5B85C] mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gemini Mentor Response</span>
          </div>
          <div className="whitespace-pre-wrap text-sm text-[#F5F5F7]/90 leading-relaxed">
            {responseText}
          </div>
        </article>
      )}

      {generatedCards.length > 0 && (
        <div className="liquid-glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">
              Generated Flashcards ({generatedCards.length})
            </h3>
            <button
              type="button"
              onClick={async () => {
                await onSaveGeneratedFlashcards(
                  generatedCards,
                  activeTopic?.id ?? null,
                  activeTopic?.categoryId ?? categories[0]?.id
                );
                setSavedNotice('Saved flashcards to your Learning Center deck.');
              }}
              className="rounded-lg bg-[#E5B85C] px-3.5 py-1.5 text-xs font-semibold text-[#080B12]"
            >
              Save All to Learning Center
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {generatedCards.map((c, idx) => (
              <div key={idx} className="rounded-lg border border-white/10 bg-black/30 p-4 space-y-2">
                <div className="text-sm font-medium text-white">{c.front}</div>
                <div className="text-xs text-slate-300">{c.back}</div>
                <div className="text-xs text-[#5EA2EF]">{c.backKm}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {generatedQuizzes.length > 0 && (
        <div className="liquid-glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">
              Generated Quiz Questions ({generatedQuizzes.length})
            </h3>
            <button
              type="button"
              onClick={async () => {
                await onSaveGeneratedQuiz(
                  generatedQuizzes.map((q) => ({
                    ...q,
                    topicId: activeTopic?.id ?? null,
                    categoryId: activeTopic?.categoryId ?? categories[0]?.id ?? 'cat-fundamentals',
                  }))
                );
                setSavedNotice('Saved quiz questions to your Learning Center.');
              }}
              className="rounded-lg bg-[#E5B85C] px-3.5 py-1.5 text-xs font-semibold text-[#080B12]"
            >
              Save Quiz to Learning Center
            </button>
          </div>
          <div className="space-y-3">
            {generatedQuizzes.map((q, idx) => (
              <div key={idx} className="rounded-lg border border-white/10 bg-black/30 p-4 space-y-2">
                <div className="text-sm font-medium text-white">{q.question}</div>
                <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                  {q.options.map((opt, i) => (
                    <li key={i} className={i === q.correctIndex ? 'text-emerald-400 font-medium' : ''}>
                      {opt}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-400">{q.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
