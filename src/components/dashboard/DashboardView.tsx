import { useMemo } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock, Compass, Orbit, Target } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Category, Language, StudyLog, Topic, UserProfile } from '../../types/knowledge';
import { computeDashboardMetrics } from '../../utils/knowledgeLogic';
import { TRANSLATIONS } from '../../i18n/translations';
import type { NavSection } from '../layout/Sidebar';
import { Achievements } from './Achievements';
import { WeeklyProgress } from './WeeklyProgress';

interface DashboardViewProps {
  profile: UserProfile;
  categories: Category[];
  topics: Topic[];
  studyLogs: StudyLog[];
  language: Language;
  onNavigate: (section: NavSection) => void;
  onOpenTopic: (topicId: string) => void;
  onOpenUniverseWithTopic: (topicId?: string, categoryId?: string) => void;
  onLogDailyCheckIn: () => void;
}

export function DashboardView({
  profile,
  categories,
  topics,
  studyLogs,
  language,
  onNavigate,
  onOpenTopic,
  onOpenUniverseWithTopic,
  onLogDailyCheckIn,
}: DashboardViewProps) {
  const t = TRANSLATIONS[language];

  const metrics = useMemo(
    () => computeDashboardMetrics(topics, categories, studyLogs, profile.dailyGoal),
    [topics, categories, studyLogs, profile.dailyGoal]
  );

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const recentlyAdded = useMemo(
    () => [...topics].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [topics]
  );

  const recentlyViewed = useMemo(
    () =>
      [...topics]
        .filter((tp) => tp.lastViewedAt)
        .sort((a, b) => (b.lastViewedAt ?? '').localeCompare(a.lastViewedAt ?? ''))
        .slice(0, 5),
    [topics]
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t.dashboard.greetingMorning
      : hour < 18
        ? t.dashboard.greetingAfternoon
        : t.dashboard.greetingEvening;

  const formattedDate = new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Hero Greeting & Daily Learning Goal */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 flex flex-col justify-between liquid-glass rounded-2xl p-6 sm:p-7">
          <div>
            <p className="text-xs text-[#A1A1AA]">
              {formattedDate} <span aria-hidden="true">·</span> {profile.roleTitle}
            </p>
            <h2 className="mt-2 font-display text-2xl sm:text-[1.85rem] font-medium tracking-tight text-[#F5F5F7] text-balance leading-snug">
              {greeting}, {profile.displayName}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#A1A1AA] leading-relaxed">
              {t.dashboard.universeCardDesc}
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenUniverseWithTopic()}
              className="liquid-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
            >
              <Orbit className="h-4 w-4" />
              <span>{t.actions.exploreUniverse}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('learning')}
              className="liquid-btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap"
            >
              <Compass className="h-4 w-4 text-[#5EA2EF]" />
              <span>{t.nav.learning}</span>
            </button>
          </div>
        </div>

        {/* Daily Learning Goal Widget */}
        <div className="lg:col-span-4 flex flex-col justify-between liquid-glass rounded-2xl p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#F5F5F7]">{t.dashboard.dailyGoal}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E5B85C]/12 border border-[#E5B85C]/25">
                <Target className="h-3.5 w-3.5 text-[#E5B85C]" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-medium text-[#F5F5F7] tabular-nums">
                {metrics.todayCompletedActions}
              </span>
              <span className="font-mono text-sm text-[#A1A1AA] tabular-nums">
                / {metrics.dailyGoalTarget} actions today
              </span>
            </div>
            <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-[#E5B85C] transition-all duration-500 ease-out"
                style={{ width: `${metrics.dailyGoalPercent}%` }}
              />
            </div>
            <p className="mt-2.5 text-xs text-[#A1A1AA]">
              {metrics.dailyGoalPercent >= 100
                ? 'Daily learning target achieved.'
                : `${metrics.dailyGoalTarget - metrics.todayCompletedActions} more study action(s) to hit today’s goal.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onLogDailyCheckIn}
            className="liquid-btn-glass mt-5 w-full rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#F5F5F7]"
          >
            Record Study Session (+1)
          </button>
        </div>
      </section>

      {/* 4-Column Minimal Glass KPI Strip */}
      <section aria-label="Knowledge Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass liquid-glass-interactive rounded-2xl p-5">
          <div className="text-xs font-medium text-[#A1A1AA]">{t.dashboard.totalNotes}</div>
          <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-medium text-[#F5F5F7] tabular-nums">
            {metrics.totalNotes}
          </div>
          <div className="mt-1.5 text-xs text-[#A1A1AA]">
            {metrics.learningTopics} active <span aria-hidden="true">·</span> {metrics.notStartedTopics} queued
          </div>
        </div>

        <div className="liquid-glass liquid-glass-interactive rounded-2xl p-5">
          <div className="text-xs font-medium text-[#A1A1AA]">{t.dashboard.totalCategories}</div>
          <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-medium text-[#5EA2EF] tabular-nums">
            {metrics.totalCategories}
          </div>
          <div className="mt-1.5 text-xs text-[#A1A1AA]">Orbital marketing fields</div>
        </div>

        <div className="liquid-glass liquid-glass-interactive rounded-2xl p-5">
          <div className="text-xs font-medium text-[#A1A1AA]">{t.dashboard.completedTopics}</div>
          <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-medium text-emerald-400 tabular-nums">
            {metrics.completedTopics}
          </div>
          <div className="mt-1.5 text-xs text-[#A1A1AA]">Mastered concepts</div>
        </div>

        <div className="liquid-glass liquid-glass-interactive rounded-2xl p-5">
          <div className="text-xs font-medium text-[#A1A1AA]">{t.dashboard.learningProgress}</div>
          <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-medium text-[#E5B85C] tabular-nums">
            {metrics.overallProgressPercent}%
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-[#E5B85C] transition-all duration-500 ease-out"
              style={{ width: `${metrics.overallProgressPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Category Mastery & Weekly Progress + Recent Feeds */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7 space-y-5">
          <div className="liquid-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-medium text-[#F5F5F7]">
                {t.dashboard.categoryMastery}
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('categories')}
                className="text-xs font-medium text-[#5EA2EF] hover:text-[#7db6f4] transition-colors whitespace-nowrap"
              >
                View all planets
              </button>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.categoryBreakdown}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <XAxis type="number" domain={[0, 100]} stroke="#71717A" fontSize={11} unit="%" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={178}
                    interval={0}
                    stroke="#A1A1AA"
                    tick={{ fill: '#A1A1AA', fontSize: 11 }}
                    tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 20, 32, 0.90)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#F5F5F7',
                      boxShadow: '0 12px 28px -8px rgba(0,0,0,0.7)',
                    }}
                    formatter={(value: unknown) => [`${value}%`, 'Mastery']}
                  />
                  <Bar dataKey="progressPercent" radius={[0, 5, 5, 0]} barSize={13} isAnimationActive={false}>
                    {metrics.categoryBreakdown.map((entry) => (
                      <Cell key={entry.categoryId} fill={entry.color} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <WeeklyProgress studyLogs={studyLogs} language={language} />
        </div>

        <div className="lg:col-span-5 space-y-5">
          {/* Recently Viewed */}
          <div className="liquid-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-medium text-[#F5F5F7] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#5EA2EF]" />
                <span>{t.dashboard.recentlyViewed}</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('notes')}
                className="text-xs text-[#A1A1AA] hover:text-[#F5F5F7] transition-colors"
              >
                All notes
              </button>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {recentlyViewed.length === 0 ? (
                <p className="py-4 text-xs text-[#A1A1AA]">Open any topic to see recent study history.</p>
              ) : (
                recentlyViewed.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => onOpenTopic(topic.id)}
                    className="group w-full flex items-center justify-between gap-3 py-2.5 text-left hover:bg-white/[0.05] px-2.5 -mx-2.5 rounded-xl transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#F5F5F7] truncate">
                        {language === 'km' && topic.titleKm ? topic.titleKm : topic.title}
                      </div>
                      <div className="text-xs text-[#A1A1AA] truncate">
                        {categoryMap.get(topic.categoryId)?.name} <span aria-hidden="true">·</span>{' '}
                        {t.statuses[topic.status]}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#A1A1AA] group-hover:text-[#F5F5F7] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Recently Added */}
          <div className="liquid-glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-medium text-[#F5F5F7] flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#E5B85C]" />
                <span>{t.dashboard.recentlyAdded}</span>
              </h3>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {recentlyAdded.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => onOpenTopic(topic.id)}
                  className="group w-full flex items-center justify-between gap-3 py-2.5 text-left hover:bg-white/[0.05] px-2.5 -mx-2.5 rounded-xl transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#F5F5F7] truncate">
                      {language === 'km' && topic.titleKm ? topic.titleKm : topic.title}
                    </div>
                    <div className="text-xs text-[#A1A1AA] truncate">
                      {categoryMap.get(topic.categoryId)?.name}
                    </div>
                  </div>
                  {topic.status === 'completed' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-[#A1A1AA] group-hover:text-[#F5F5F7] group-hover:translate-x-0.5 transition-all shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Study Milestones & Achievements */}
      <Achievements studyLogs={studyLogs} topics={topics} language={language} />
    </div>
  );
}
