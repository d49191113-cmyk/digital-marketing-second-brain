import { useMemo, useState } from 'react';
import { Award, BookCheck, Brain, Compass, Flame, Lock, Sparkles, Trophy } from 'lucide-react';
import type { AchievementMilestone, Language, StudyLog, Topic } from '../../types/knowledge';
import { computeAchievements } from '../../utils/knowledgeLogic';
import { TRANSLATIONS } from '../../i18n/translations';

interface AchievementsProps {
  studyLogs: StudyLog[];
  topics: Topic[];
  language: Language;
}

type MilestoneFilter = 'all' | 'unlocked' | 'in_progress';

function renderMilestoneIcon(iconKey: AchievementMilestone['iconKey'], unlocked: boolean) {
  const cls = `h-4 w-4 ${unlocked ? 'text-[#E5B85C]' : 'text-[#A1A1AA]'}`;
  switch (iconKey) {
    case 'flame':
      return <Flame className={cls} />;
    case 'trophy':
      return <Trophy className={cls} />;
    case 'book':
      return <BookCheck className={cls} />;
    case 'brain':
      return <Brain className={cls} />;
    case 'compass':
      return <Compass className={cls} />;
    case 'sparkles':
    default:
      return <Sparkles className={cls} />;
  }
}

export function Achievements({ studyLogs, topics, language }: AchievementsProps) {
  const t = TRANSLATIONS[language];
  const [filter, setFilter] = useState<MilestoneFilter>('all');

  const summary = useMemo(
    () => computeAchievements(studyLogs, topics),
    [studyLogs, topics]
  );

  const visibleMilestones = useMemo(() => {
    if (filter === 'unlocked') return summary.milestones.filter((m) => m.unlocked);
    if (filter === 'in_progress') return summary.milestones.filter((m) => !m.unlocked);
    return summary.milestones;
  }, [filter, summary.milestones]);

  const formatUnlockDate = (iso: string | null) => {
    if (!iso) return language === 'km' ? 'បានដោះសោ' : 'Unlocked';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return language === 'km' ? 'បានដោះសោ' : 'Unlocked';
    return new Intl.DateTimeFormat(language === 'km' ? 'km-KH' : 'en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(d);
  };

  return (
    <section
      aria-label={t.dashboard.achievementsTitle}
      className="liquid-glass rounded-2xl p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-[#E5B85C]" />
            <h3 className="font-display text-base font-medium text-[#F5F5F7]">
              {t.dashboard.achievementsTitle}
            </h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#A1A1AA]">
            <span className="font-mono text-[#F5F5F7] tabular-nums">
              {summary.currentStreak}d {language === 'km' ? 'ជាប់គ្នា' : 'streak'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#E5B85C] tabular-nums">
              {summary.unlockedCount}/{summary.milestones.length}{' '}
              {language === 'km' ? 'បានដោះសោ' : 'unlocked'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#5EA2EF] tabular-nums">
              {summary.totalPoints} XP
            </span>
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter milestones"
          className="inline-flex items-center gap-1 self-start rounded-xl liquid-glass-subtle p-1"
        >
          {(
            [
              { id: 'all', label: language === 'km' ? 'ទាំងអស់' : 'All' },
              { id: 'unlocked', label: language === 'km' ? 'បានដោះសោ' : 'Unlocked' },
              { id: 'in_progress', label: language === 'km' ? 'កំពុងដំណើរការ' : 'In Progress' },
            ] as const
          ).map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 whitespace-nowrap active:scale-[0.98] ${
                  active
                    ? 'bg-[#E5B85C] text-[#080B12] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]'
                    : 'text-[#A1A1AA] hover:text-[#F5F5F7]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {visibleMilestones.length === 0 ? (
        <p className="mt-6 py-6 text-center text-sm text-[#A1A1AA]">
          {filter === 'unlocked'
            ? 'No milestones unlocked yet — log a study session or complete topics to earn your first badge.'
            : 'All study milestones have been unlocked.'}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleMilestones.map((milestone) => {
            const title = language === 'km' ? milestone.titleKm : milestone.title;
            const description =
              language === 'km' ? milestone.descriptionKm : milestone.description;

            return (
              <div
                key={milestone.id}
                className={`flex flex-col justify-between rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 ${
                  milestone.unlocked
                    ? 'border border-[#E5B85C]/30 bg-[#E5B85C]/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]'
                    : 'liquid-glass-subtle'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                          milestone.unlocked
                            ? 'border-[#E5B85C]/40 bg-[#E5B85C]/12'
                            : 'border-white/[0.10] bg-white/[0.04]'
                        }`}
                      >
                        {renderMilestoneIcon(milestone.iconKey, milestone.unlocked)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-[#F5F5F7] truncate">{title}</h4>
                        <div className="text-[11px] text-[#A1A1AA]">
                          {milestone.unlocked ? (
                            <span className="text-[#E5B85C]">
                              {language === 'km' ? 'សម្រេចបាន' : 'Achieved'}{' '}
                              <span aria-hidden="true">·</span> {formatUnlockDate(milestone.unlockedAt)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#A1A1AA]">
                              <Lock className="h-3 w-3" />
                              <span>{language === 'km' ? 'កំពុងបន្ត' : 'In progress'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-medium text-[#F5F5F7]/80 tabular-nums shrink-0">
                      {milestone.current}/{milestone.target}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-[#A1A1AA] leading-relaxed">{description}</p>
                </div>

                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        milestone.unlocked ? 'bg-[#E5B85C]' : 'bg-[#5EA2EF]'
                      }`}
                      style={{ width: `${milestone.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
