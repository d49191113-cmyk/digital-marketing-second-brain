import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  History,
  Layers,
  Plus,
  RotateCw,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type {
  Category,
  Flashcard,
  Language,
  QuizQuestion,
  StudyLog,
  Topic,
} from '../../types/knowledge';
import { computeDashboardMetrics, scoreQuizAttempt } from '../../utils/knowledgeLogic';
import { TRANSLATIONS } from '../../i18n/translations';

interface LearningCenterViewProps {
  categories: Category[];
  topics: Topic[];
  flashcards: Flashcard[];
  quizzes: QuizQuestion[];
  studyLogs: StudyLog[];
  dailyGoal: number;
  language: Language;
  onOpenTopic: (topicId: string) => void;
  onReviewFlashcard: (cardId: string, masteryLevel: number) => Promise<void>;
  onCreateFlashcard: (payload: {
    topicId?: string | null;
    categoryId: string;
    front: string;
    back: string;
    backKm?: string;
  }) => Promise<void>;
  onSubmitQuizLog: (summary: string, points: number) => Promise<void>;
}

type StudyTab = 'roadmap' | 'flashcards' | 'quizzes' | 'summaries' | 'history';

export function LearningCenterView({
  categories,
  topics,
  flashcards,
  quizzes,
  studyLogs,
  dailyGoal,
  language,
  onOpenTopic,
  onReviewFlashcard,
  onCreateFlashcard,
  onSubmitQuizLog,
}: LearningCenterViewProps) {
  const t = TRANSLATIONS[language];
  const [tab, setTab] = useState<StudyTab>('roadmap');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const [newCardModal, setNewCardModal] = useState(false);
  const [cardCat, setCardCat] = useState(categories[0]?.id ?? '');
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardBackKm, setCardBackKm] = useState('');

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [revealedShort, setRevealedShort] = useState<Record<string, boolean>>({});

  const metrics = useMemo(
    () => computeDashboardMetrics(topics, categories, studyLogs, dailyGoal),
    [topics, categories, studyLogs, dailyGoal]
  );

  const currentCard = flashcards[cardIndex % Math.max(1, flashcards.length)];
  const quizResult = useMemo(() => scoreQuizAttempt(quizzes, answers), [quizzes, answers]);

  const handleRateCard = async (level: number) => {
    if (!currentCard) return;
    await onReviewFlashcard(currentCard.id, level);
    setFlipped(false);
    setCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardFront.trim() || !cardBack.trim()) return;
    await onCreateFlashcard({
      categoryId: cardCat || categories[0].id,
      front: cardFront.trim(),
      back: cardBack.trim(),
      backKm: cardBackKm.trim() || undefined,
    });
    setCardFront('');
    setCardBack('');
    setCardBackKm('');
    setNewCardModal(false);
  };

  const handleGradeQuiz = async () => {
    setQuizSubmitted(true);
    await onSubmitQuizLog(
      `Completed quiz (${quizResult.correct}/${quizResult.total} · ${quizResult.scorePercent}%)`,
      Math.max(2, quizResult.correct * 2)
    );
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header & Weekly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 liquid-glass rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-xl font-medium text-[#F5F5F7]">{t.nav.learning}</h2>
            <p className="mt-1 text-sm text-[#A1A1AA]">
              Track mastery across all marketing planets, practice active recall, and review history.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <div className="text-[11px] text-[#A1A1AA]">Completed</div>
                <div className="font-mono text-2xl font-medium text-emerald-400 tabular-nums">
                  {metrics.completedTopics}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#A1A1AA]">Learning</div>
                <div className="font-mono text-2xl font-medium text-[#E5B85C] tabular-nums">
                  {metrics.learningTopics}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#A1A1AA]">Daily Goal</div>
                <div className="font-mono text-2xl font-medium text-[#5EA2EF] tabular-nums">
                  {metrics.todayCompletedActions}/{metrics.dailyGoalTarget}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-[#E5B85C] transition-all duration-500 ease-out"
              style={{ width: `${metrics.overallProgressPercent}%` }}
            />
          </div>
        </div>

        <div className="lg:col-span-7 liquid-glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-medium text-[#F5F5F7]">
              Weekly Learning Activity (Minutes)
            </h3>
            <span className="font-mono text-xs text-[#A1A1AA] tabular-nums">Last 7 days</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.weeklyStats} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="studyGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E5B85C" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#E5B85C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#71717A" fontSize={11} />
                <YAxis stroke="#71717A" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 20, 32, 0.90)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F5F5F7',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="#E5B85C"
                  strokeWidth={2}
                  fill="url(#studyGold)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div role="tablist" aria-label="Study Modes" className="flex flex-wrap gap-1 liquid-glass rounded-2xl p-1.5">
        {(
          [
            { id: 'roadmap', label: 'Learning Roadmap', icon: Target },
            { id: 'flashcards', label: `Flashcards (${flashcards.length})`, icon: Layers },
            { id: 'quizzes', label: `Quizzes (${quizzes.length})`, icon: CheckCircle2 },
            { id: 'summaries', label: 'Topic Summaries', icon: Sparkles },
            { id: 'history', label: 'Review History', icon: History },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all whitespace-nowrap active:scale-[0.98] ${
                tab === item.id
                  ? 'bg-[#E5B85C] text-[#080B12] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]'
                  : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Roadmap */}
      {tab === 'roadmap' && (
        <div className="space-y-4">
          {metrics.categoryBreakdown.map((stat, idx) => {
            const catTopics = topics.filter((tp) => tp.categoryId === stat.categoryId);
            return (
              <section
                key={stat.categoryId}
                className="liquid-glass rounded-2xl p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <h3 className="font-display text-base font-semibold text-white">{stat.name}</h3>
                  </div>
                  <span className="font-mono text-xs text-slate-300 tabular-nums">
                    {stat.completed} completed · {stat.learning} active · {stat.progressPercent}%
                  </span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${stat.progressPercent}%`, backgroundColor: stat.color }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {catTopics.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => onOpenTopic(tp.id)}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-left text-xs hover:border-white/25 transition-colors"
                    >
                      <span className="truncate text-slate-200">{tp.title}</span>
                      <span
                        className={`shrink-0 font-mono text-[10px] ${
                          tp.status === 'completed'
                            ? 'text-emerald-400'
                            : tp.status === 'learning'
                              ? 'text-[#E5B85C]'
                              : 'text-slate-500'
                        }`}
                      >
                        {t.statuses[tp.status]}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* TAB 2: Flashcards */}
      {tab === 'flashcards' && (
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              Card {flashcards.length > 0 ? (cardIndex % flashcards.length) + 1 : 0} of {flashcards.length}
            </span>
            <button
              type="button"
              onClick={() => setNewCardModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Flashcard</span>
            </button>
          </div>

          {currentCard ? (
            <div className="liquid-glass rounded-2xl p-8 space-y-6">
              <div className="text-xs text-[#A1A1AA]">
                Mastery Level {currentCard.masteryLevel}/5
              </div>

              <button
                type="button"
                onClick={() => setFlipped((f) => !f)}
                className="w-full min-h-[160px] flex flex-col items-center justify-center text-center rounded-2xl liquid-glass-subtle p-6 hover:border-[#E5B85C]/40 transition-all"
              >
                <span className="text-[11px] uppercase tracking-wider text-[#E5B85C] mb-3">
                  {flipped ? 'Answer' : 'Prompt — Click to Flip'}
                </span>
                <p className="font-display text-lg sm:text-xl font-medium text-white leading-relaxed">
                  {flipped ? currentCard.back : currentCard.front}
                </p>
                {flipped && currentCard.backKm && (
                  <p className="mt-3 text-sm text-slate-300">{currentCard.backKm}</p>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setFlipped((f) => !f)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200 hover:text-white"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Flip Card</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRateCard(Math.max(1, currentCard.masteryLevel - 1))}
                    className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10"
                  >
                    Need Review
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRateCard(Math.min(5, currentCard.masteryLevel + 1))}
                    className="rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Got It (+1 Mastery)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#0B101B] p-8 text-center text-sm text-slate-400">
              No flashcards yet. Create one to start active recall practice.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Quizzes & Short Answer */}
      {tab === 'quizzes' && (
        <div className="mx-auto max-w-3xl space-y-5">
          {quizzes.map((q, qIdx) => {
            const chosen = answers[q.id];
            return (
              <div
                key={q.id}
                className="liquid-glass rounded-2xl p-6 space-y-3"
              >
                <div className="font-mono text-xs text-slate-400">Question {qIdx + 1}</div>
                <h3 className="font-display text-base font-medium text-white">{q.question}</h3>
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const selected = chosen === optIdx;
                    const isCorrect = optIdx === q.correctIndex;
                    let cls = 'border-white/10 bg-white/[0.02] text-slate-200 hover:border-white/25';
                    if (quizSubmitted) {
                      if (isCorrect) cls = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200';
                      else if (selected) cls = 'border-rose-500/60 bg-rose-500/15 text-rose-200';
                    } else if (selected) {
                      cls = 'border-[#E5B85C] bg-[#E5B85C]/15 text-white';
                    }
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => {
                          if (!quizSubmitted) {
                            setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                          }
                        }}
                        className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <p className="text-xs text-slate-300 pt-1">{q.explanation}</p>
                )}

                {q.shortAnswerPrompt && (
                  <div className="pt-3 border-t border-white/[0.07] space-y-2">
                    <label
                      htmlFor={`short-${q.id}`}
                      className="block text-xs font-medium text-[#5EA2EF]"
                    >
                      Short-Answer Practice: {q.shortAnswerPrompt}
                    </label>
                    <textarea
                      id={`short-${q.id}`}
                      rows={2}
                      value={shortAnswers[q.id] ?? ''}
                      onChange={(e) =>
                        setShortAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Write your own concise explanation..."
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedShort((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                      }
                      className="text-xs text-[#E5B85C] hover:underline"
                    >
                      {revealedShort[q.id] ? 'Hide Sample Answer' : 'Reveal Sample Answer'}
                    </button>
                    {revealedShort[q.id] && q.sampleShortAnswer && (
                      <p className="text-xs text-slate-300 bg-white/[0.03] rounded-lg p-3">
                        {q.sampleShortAnswer}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-3 liquid-glass rounded-2xl p-5">
            {quizSubmitted ? (
              <div className="text-sm text-[#F5F5F7]">
                Score:{' '}
                <span className="font-mono font-semibold text-[#E5B85C] tabular-nums">
                  {quizResult.correct}/{quizResult.total} ({quizResult.scorePercent}%)
                </span>
              </div>
            ) : (
              <div className="text-xs text-[#A1A1AA]">
                Answered {quizResult.answered} of {quizResult.total} questions
              </div>
            )}

            <div className="flex gap-2">
              {quizSubmitted ? (
                <button
                  type="button"
                  onClick={() => {
                    setAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="liquid-btn-glass rounded-xl px-4 py-2 text-xs font-medium"
                >
                  Retake Quiz
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGradeQuiz}
                  className="liquid-btn-primary rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Check Answers & Log Score
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Topic Summaries */}
      {tab === 'summaries' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.slice(0, 24).map((tp) => (
            <button
              key={tp.id}
              type="button"
              onClick={() => onOpenTopic(tp.id)}
              className="text-left liquid-glass liquid-glass-interactive rounded-2xl p-5"
            >
              <div className="text-xs text-[#E5B85C]">{t.statuses[tp.status]}</div>
              <h3 className="mt-1 font-display text-sm font-medium text-[#F5F5F7]">{tp.title}</h3>
              <p className="mt-1.5 text-xs text-[#A1A1AA] leading-relaxed">{tp.simpleExplanation}</p>
            </button>
          ))}
        </div>
      )}

      {/* TAB 5: Review History */}
      {tab === 'history' && (
        <div className="liquid-glass rounded-2xl divide-y divide-white/[0.07] overflow-hidden">
          {studyLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#A1A1AA]">No study sessions logged yet.</div>
          ) : (
            studyLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors">
                <div>
                  <div className="text-sm text-[#F5F5F7]">{log.summary}</div>
                  <div className="text-xs text-[#A1A1AA]">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className="font-mono text-xs text-[#E5B85C] tabular-nums">
                  +{log.points} pts
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Flashcard Modal */}
      {newCardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create Flashcard"
        >
          <form
            onSubmit={handleAddCard}
            className="w-full max-w-md liquid-glass-modal rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">New Flashcard</h3>
              <button
                type="button"
                onClick={() => setNewCardModal(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label htmlFor="fc-cat" className="block text-xs text-slate-300 mb-1">
                Category
              </label>
              <select
                id="fc-cat"
                value={cardCat}
                onChange={(e) => setCardCat(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="fc-front" className="block text-xs text-slate-300 mb-1">
                Front Question / Prompt
              </label>
              <textarea
                id="fc-front"
                required
                rows={2}
                value={cardFront}
                onChange={(e) => setCardFront(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="fc-back" className="block text-xs text-slate-300 mb-1">
                Back Answer (English)
              </label>
              <textarea
                id="fc-back"
                required
                rows={3}
                value={cardBack}
                onChange={(e) => setCardBack(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="fc-back-km" className="block text-xs text-slate-300 mb-1">
                Khmer Explanation (Optional)
              </label>
              <input
                id="fc-back-km"
                type="text"
                value={cardBackKm}
                onChange={(e) => setCardBackKm(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewCardModal(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#E5B85C] px-4 py-2 text-xs font-semibold text-[#080B12]"
              >
                Save Flashcard
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
